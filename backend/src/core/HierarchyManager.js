const Blockchain = require('./Blockchain');
const { readBlockchainData, writeBlockchainData } = require('../utils/fileService');

const DATA_FILE = 'bams_structure.json';

/**
 * Manages the entire multi-layered blockchain structure. (Department -> Class -> Student)
 */
class HierarchyManager {
    constructor() {
        this.chains = {
            departments: {}, // Stores Department Chains
            classes: {},     // Stores Class Chains
            students: {}     // Stores Student Chains
        };
        this.loadChains();
    }

    /**
     * Loads the entire blockchain structure from the persistent file.
     * Initializes Blockchain objects from stored JSON data.
     */
    async loadChains() {
        try {
            const data = await readBlockchainData(DATA_FILE);
            if (!data) return;

            // Recreate Department Chains
            for (const id in data.departments) {
                this.chains.departments[id] = this._rehydrateChain(data.departments[id]);
            }

            // Recreate Class Chains
            for (const id in data.classes) {
                this.chains.classes[id] = this._rehydrateChain(data.classes[id]);
            }

            // Recreate Student Chains
            for (const id in data.students) {
                this.chains.students[id] = this._rehydrateChain(data.students[id]);
            }

            console.log("Blockchain structure loaded successfully.");
        } catch (error) {
            console.error("Failed to load blockchain data, starting with empty structure:", error.message);
        }
    }

    /**
     * Helper to convert a plain JSON chain back into a Blockchain object.
     * @param {object} chainData - The JSON representation of the chain.
     * @returns {Blockchain} The re-hydrated Blockchain instance.
     */
    _rehydrateChain(chainData) {
        const chain = new Blockchain(chainData.id, chainData.type, chainData.chain[0].prev_hash);
        // Clear the auto-generated genesis and populate from file
        chain.chain = [];
        for (const blockData of chainData.chain) {
            const Block = require('./Block');
            const block = new Block(
                blockData.index,
                blockData.transactions,
                blockData.prev_hash,
                blockData.timestamp  // Pass the original timestamp
            );
            // Set hash and nonce directly from file to preserve the mined block state
            block.hash = blockData.hash;
            block.nonce = blockData.nonce;
            // Recalculate hash to ensure it matches the stored hash
            const recalculatedHash = block.recalculateHash();
            if (recalculatedHash !== blockData.hash) {
                console.warn(`Block ${blockData.index} hash mismatch. Expected ${blockData.hash}, got ${recalculatedHash}`);
            }
            chain.chain.push(block);
        }
        return chain;
    }

    /**
     * Saves the current blockchain structure to the persistent file.
     */
    async saveChains() {
        const dataToSave = {
            departments: {},
            classes: {},
            students: {}
        };
        for (const id in this.chains.departments) {
            dataToSave.departments[id] = this.chains.departments[id].toJSON();
        }
        for (const id in this.chains.classes) {
            dataToSave.classes[id] = this.chains.classes[id].toJSON();
        }
        for (const id in this.chains.students) {
            dataToSave.students[id] = this.chains.students[id].toJSON();
        }
        await writeBlockchainData(DATA_FILE, dataToSave);
    }

    /**
     * Creates a new Department Chain (Layer 1) [cite: 11]
     * @param {string} departmentId
     * @returns {Blockchain}
     */
    createDepartmentChain(departmentId) {
        if (this.chains.departments[departmentId]) {
            throw new Error(`Department chain ${departmentId} already exists.`);
        }
        const newChain = new Blockchain(departmentId, 'department');
        this.chains.departments[departmentId] = newChain;
        return newChain;
    }

    /**
     * Creates a new Class Chain (Layer 2) - Child of Department Chain. [cite: 13, 57, 58, 104, 106]
     * @param {string} classId
     * @param {string} departmentId
     * @returns {Blockchain}
     */
    createClassChain(classId, departmentId) {
        const departmentChain = this.chains.departments[departmentId];
        if (!departmentChain) {
            throw new Error(`Department chain ${departmentId} not found.`);
        }

        const parentHash = departmentChain.getLatestBlock().hash;
        const newChain = new Blockchain(classId, 'class', parentHash);
        this.chains.classes[classId] = newChain;
        return newChain;
    }

    /**
     * Creates a new Student Chain (Layer 3) - Child of Class Chain. [cite: 17, 68, 69, 107, 109]
     * @param {string} studentId
     * @param {string} classId
     * @returns {Blockchain}
     */
    createStudentChain(studentId, classId) {
        const classChain = this.chains.classes[classId];
        if (!classChain) {
            throw new Error(`Class chain ${classId} not found.`);
        }

        const parentHash = classChain.getLatestBlock().hash;
        const newChain = new Blockchain(studentId, 'student', parentHash);
        this.chains.students[studentId] = newChain;
        return newChain;
    }

    /**
     * Adds an attendance block to a Student Chain (Layer 4) [cite: 20, 76, 110, 111]
     * @param {string} studentId
     * @param {object} attendanceData
     * @returns {Block}
     */
    addAttendanceBlock(studentId, attendanceData) {
        const studentChain = this.chains.students[studentId];
        if (!studentChain) {
            throw new Error(`Student chain ${studentId} not found.`);
        }

        // Attendance record must contain required fields [cite: 82, 83, 84, 85, 86]
        const transaction = {
            type: 'attendance',
            ...attendanceData
        };

        const newBlock = studentChain.addBlock(transaction);
        return newBlock;
    }
    
    /**
     * Validates the entire blockchain hierarchy.
     * @returns {object} Validation result { isValid: boolean, message: string, errors: string[] }
     */
    validateHierarchy() {
    const validationResult = {
        isValid: true,
        message: 'All chains are valid.',
        errors: []
    };

    // 1. First validate all departments
    for (const deptId in this.chains.departments) {
        const deptChain = this.chains.departments[deptId];
        if (!deptChain.isChainValid()) {
            validationResult.isValid = false;
            validationResult.errors.push(`Department Chain (${deptId}) is invalid.`);
        }
    }

    // 2. Then validate classes and their links to departments
    for (const classId in this.chains.classes) {
        const classChain = this.chains.classes[classId];
        
        // Check if the class chain itself is valid
        if (!classChain.isChainValid()) {
            validationResult.isValid = false;
            validationResult.errors.push(`Class Chain (${classId}) is invalid.`);
            continue;
        }

        // Get the department ID from the class's first transaction
        const classData = classChain.chain[1]?.transactions; // First block is genesis, second has the class data
        if (!classData || !classData.departmentId) {
            validationResult.isValid = false;
            validationResult.errors.push(`Class Chain (${classId}) is missing department reference.`);
            continue;
        }

        const deptId = classData.departmentId;
        const deptChain = this.chains.departments[deptId];
        
        if (!deptChain) {
            validationResult.isValid = false;
            validationResult.errors.push(`Class ${classId} references non-existent department ${deptId}`);
            continue;
        }

        // Check if the class's prev_hash points to a valid block in the department's chain
        const classGenesisPrevHash = classChain.chain[0].prev_hash;
        const isLinked = deptChain.chain.some(block => block.hash === classGenesisPrevHash);
        
        if (!isLinked) {
            validationResult.isValid = false;
            validationResult.errors.push(`Class ${classId} is not properly linked to department ${deptId}`);
        }
    }

    // Update the result message based on validation
    if (!validationResult.isValid) {
        validationResult.message = `Validation failed with ${validationResult.errors.length} error(s)`;
    }

    return validationResult;
}
    
    // Getter methods for services
    getDepartmentChains() {
        return this.chains.departments;
    }
    getClassChains() {
        return this.chains.classes;
    }
    getStudentChains() {
        return this.chains.students;
    }
    getChain(type, id) {
        return this.chains[type][id];
    }
}

// Singleton pattern to ensure only one instance manages the chains
const hierarchyManager = new HierarchyManager();
module.exports = hierarchyManager;