const hierarchyManager = require('../core/HierarchyManager');

class ClassService {
    /**
     * Creates a new class, creating its own chain linked to the parent department's latest block. [cite: 56, 57, 58]
     * @param {string} name
     * @param {string} departmentId
     * @returns {Promise<object>}
     */
    async createClass(name, departmentId) {
        const id = `${departmentId}_${name.toLowerCase().replace(/\s/g, '_')}`;
        if (hierarchyManager.getChain('classes', id)) {
            throw new Error('Class already exists in this department.');
        }

        // Get the department's latest block hash for the new chain's genesis prev_hash
        const departmentChain = hierarchyManager.getChain('departments', departmentId);
        if (!departmentChain || departmentChain.chain.slice().reverse().find(b => b.transactions.data.status === 'deleted')) {
             throw new Error(`Department ${departmentId} not found or is marked as deleted.`);
        }

        const newChain = hierarchyManager.createClassChain(id, departmentId);
        
        // Add metadata block to the class chain
        const metadata = { name, departmentId, status: 'active' };
        newChain.addBlock({ type: 'metadata', data: metadata, action: 'CREATE' });
        
        await hierarchyManager.saveChains();
        return { id, departmentId, chainLength: newChain.chain.length };
    }

    /**
     * Retrieves the current (latest) state of all classes, optionally filtered by department.
     * @param {string} departmentId - Optional filter.
     * @returns {object[]} Array of class objects with latest metadata.
     */
    getClasses(departmentId = null) {
        const classes = [];
        const chains = hierarchyManager.getClassChains();

        for (const id in chains) {
            const chain = chains[id].chain;
            // Find the most recent active/non-deleted metadata block
            const latestBlock = chain.slice().reverse().find(b => 
                b.transactions.type === 'metadata' && b.transactions.data.status !== 'deleted'
            );
            
            if (latestBlock) {
                const classData = {
                    id: chains[id].id,
                    ...latestBlock.transactions.data,
                    latestBlockHash: latestBlock.hash
                };

                if (!departmentId || classData.departmentId === departmentId) {
                    classes.push(classData);
                }
            }
        }
        return classes;
    }
    
    /**
     * Finds a class by name/ID, reading the most recent block.
     * @param {string} id
     * @returns {object | null}
     */
    getClassById(id) {
        const chain = hierarchyManager.getChain('classes', id);
        if (!chain) return null;

        // Find the most recent block that is not 'deleted'
        const latestBlock = chain.chain.slice().reverse().find(b => 
            b.transactions.type === 'metadata' && b.transactions.data.status !== 'deleted'
        );

        return latestBlock ? { id, ...latestBlock.transactions.data, chain } : null;
    }

    /**
     * Updates a class by appending a new block with updated metadata. [cite: 59, 61, 62, 64]
     * @param {string} id
     * @param {object} updates
     * @returns {Promise<object>} The new block.
     */
    async updateClass(id, updates) {
        const classObj = this.getClassById(id);
        if (!classObj) {
            throw new Error(`Class ${id} not found.`);
        }

        const classChain = hierarchyManager.getChain('classes', id);
        const newMetadata = { ...classObj.data, ...updates };

        const newBlock = classChain.addBlock({ 
            type: 'metadata', 
            data: newMetadata, 
            action: 'UPDATE' 
        });

        await hierarchyManager.saveChains();
        return newBlock;
    }

    /**
     * "Deletes" a class by appending a new block with status: "deleted". [cite: 59, 61, 63, 64]
     * @param {string} id
     * @returns {Promise<object>} The new block.
     */
    async deleteClass(id) {
        const classObj = this.getClassById(id);
        if (!classObj) {
            throw new Error(`Class ${id} not found.`);
        }

        const classChain = hierarchyManager.getChain('classes', id);
        const deletedMetadata = { ...classObj.data, status: 'deleted' };

        const newBlock = classChain.addBlock({ 
            type: 'metadata', 
            data: deletedMetadata, 
            action: 'DELETE' 
        });

        await hierarchyManager.saveChains();
        return newBlock;
    }
    
    /**
     * Searches classes by name or ID.
     * @param {string} searchTerm
     * @returns {object[]}
     */
    searchClasses(searchTerm) {
        const term = searchTerm.toLowerCase();
        return this.getClasses().filter(classObj => 
            classObj.name.toLowerCase().includes(term) || classObj.id.includes(term)
        );
    }
}

module.exports = new ClassService();