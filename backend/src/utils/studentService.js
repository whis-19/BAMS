const hierarchyManager = require('../core/HierarchyManager');

class StudentService {
    /**
     * Creates a new student, creating their personal chain linked to the parent class's latest block. [cite: 67, 68, 69]
     * @param {string} name
     * @param {string} rollNumber
     * @param {string} departmentId
     * @param {string} classId
     * @returns {Promise<object>}
     */
    async createStudent(name, rollNumber, departmentId, classId) {
        const id = rollNumber.toLowerCase().replace(/\s/g, '_');
        if (hierarchyManager.getChain('students', id)) {
            throw new Error('Student with this roll number already exists.');
        }
        
        // Check if parent chain (Class) exists
        const classChain = hierarchyManager.getChain('classes', classId);
        if (!classChain || classChain.chain.slice().reverse().find(b => b.transactions.data.status === 'deleted')) {
             throw new Error(`Class ${classId} not found or is marked as deleted.`);
        }
        
        const newChain = hierarchyManager.createStudentChain(id, classId);
        
        // Add metadata block to the student chain
        const metadata = { name, rollNumber, departmentId, classId, status: 'active' };
        newChain.addBlock({ type: 'metadata', data: metadata, action: 'CREATE' });
        
        await hierarchyManager.saveChains();
        return { id, departmentId, classId, chainLength: newChain.chain.length };
    }

    /**
     * Retrieves the current (latest) state of all students.
     * @returns {object[]} Array of student objects with latest metadata.
     */
    getStudents() {
        const students = [];
        const chains = hierarchyManager.getStudentChains();

        for (const id in chains) {
            const chain = chains[id].chain;
            // Find the most recent active/non-deleted metadata block [cite: 75]
            const latestBlock = chain.slice().reverse().find(b => 
                b.transactions.type === 'metadata' && b.transactions.data.status !== 'deleted'
            );
            
            if (latestBlock) {
                students.push({
                    id: chains[id].id,
                    ...latestBlock.transactions.data,
                    latestBlockHash: latestBlock.hash
                });
            }
        }
        return students;
    }
    
    /**
     * Finds a student by roll number/ID, reading the most recent block.
     * @param {string} id - Student ID (roll number)
     * @returns {object | null}
     */
    getStudentById(id) {
        const chain = hierarchyManager.getChain('students', id);
        if (!chain) return null;

        // Find the most recent block that is not 'deleted'
        const latestMetadataBlock = chain.chain.slice().reverse().find(b => 
            b.transactions.type === 'metadata' && b.transactions.data.status !== 'deleted'
        );

        if (!latestMetadataBlock) return null;

        return { 
            id, 
            ...latestMetadataBlock.transactions.data, 
            chain,
            attendanceHistory: this.getStudentAttendance(id)
        };
    }

    /**
     * Updates a student by appending a new block with updated metadata. [cite: 70, 72, 74, 75]
     * @param {string} id
     * @param {object} updates
     * @returns {Promise<object>} The new block.
     */
    async updateStudent(id, updates) {
        const student = this.getStudentById(id);
        if (!student) {
            throw new Error(`Student ${id} not found.`);
        }

        const studentChain = hierarchyManager.getChain('students', id);
        const newMetadata = { ...student, ...updates }; // Merge latest active metadata with updates

        const newBlock = studentChain.addBlock({ 
            type: 'metadata', 
            data: newMetadata, 
            action: 'UPDATE' 
        });

        await hierarchyManager.saveChains();
        return newBlock;
    }

    /**
     * "Deletes" a student by appending a new block with status: "deleted". [cite: 70, 72, 73]
     * @param {string} id
     * @returns {Promise<object>} The new block.
     */
    async deleteStudent(id) {
        const student = this.getStudentById(id);
        if (!student) {
            throw new Error(`Student ${id} not found.`);
        }

        const studentChain = hierarchyManager.getChain('students', id);
        const deletedMetadata = { ...student, status: 'deleted' };

        const newBlock = studentChain.addBlock({ 
            type: 'metadata', 
            data: deletedMetadata, 
            action: 'DELETE' 
        });

        await hierarchyManager.saveChains();
        return newBlock;
    }
    
    /**
     * Searches students by name or roll number. [cite: 37]
     * @param {string} searchTerm
     * @returns {object[]}
     */
    searchStudents(searchTerm) {
        const term = searchTerm.toLowerCase();
        return this.getStudents().filter(student => 
            student.name.toLowerCase().includes(term) || student.rollNumber.toLowerCase().includes(term)
        );
    }
    
    // --- Attendance Logic ---
    
    /**
     * Marks attendance for a student, creating a new block in their personal chain. [cite: 39, 40, 81]
     * @param {string} studentId
     * @param {string} status - 'Present', 'Absent', or 'Leave' [cite: 77, 78, 79, 80]
     * @returns {Promise<object>} The attendance block.
     */
    async markAttendance(studentId, status) {
        const student = this.getStudentById(studentId);
        if (!student || student.status === 'deleted') {
            throw new Error(`Student ${studentId} not found or is deleted.`);
        }
        
        // Ensure status is valid
        const validStatuses = ['Present', 'Absent', 'Leave'];
        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid attendance status: ${status}. Must be one of ${validStatuses.join(', ')}`);
        }
        
        // Prepare attendance data including mandatory fields [cite: 82, 83, 84, 85, 86]
        const attendanceData = {
            studentId: student.id,
            name: student.name,
            rollNumber: student.rollNumber,
            departmentId: student.departmentId,
            classId: student.classId,
            status: status, // Present, Absent, Leave
            date: new Date().toISOString().split('T')[0] // Date for easy filtering
        };
        
        // Add the attendance block to the student's chain (Layer 4) [cite: 110, 111]
        const newBlock = hierarchyManager.addAttendanceBlock(studentId, attendanceData);

        await hierarchyManager.saveChains();
        return newBlock;
    }

    /**
     * Retrieves the attendance history for a specific student. [cite: 38]
     * @param {string} studentId
     * @returns {object[]} Array of attendance blocks.
     */
    getStudentAttendance(studentId) {
        const studentChain = hierarchyManager.getChain('students', studentId);
        if (!studentChain) return [];

        // Filter for blocks that represent attendance records
        return studentChain.chain.filter(block => 
            block.transactions.type !== 'metadata'
        ).map(block => ({
            index: block.index,
            timestamp: block.timestamp,
            status: block.transactions.status,
            date: block.transactions.date,
            prev_hash: block.prev_hash,
            hash: block.hash,
            nonce: block.nonce
        }));
    }
    
    /**
     * Retrieves attendance records for all students for a specific date, class, or department. [cite: 41]
     * @param {object} filters - { date: 'YYYY-MM-DD', classId: '...', departmentId: '...' }
     * @returns {object[]} Array of attendance records.
     */
    getFilteredAttendance(filters = {}) {
        const allStudents = this.getStudents();
        let allAttendance = [];

        // 1. Compile all attendance records
        for (const student of allStudents) {
            // Only consider non-deleted students
            if (student.status !== 'deleted') {
                const history = this.getStudentAttendance(student.id);
                allAttendance = allAttendance.concat(history.map(record => ({ 
                    ...record.transactions, 
                    ...record,
                    studentName: student.name 
                })));
            }
        }
        
        // 2. Apply filters
        let filteredAttendance = allAttendance;

        if (filters.departmentId) {
            filteredAttendance = filteredAttendance.filter(r => r.departmentId === filters.departmentId);
        }
        
        if (filters.classId) {
            filteredAttendance = filteredAttendance.filter(r => r.classId === filters.classId);
        }

        if (filters.date) {
            filteredAttendance = filteredAttendance.filter(r => r.date === filters.date);
        } else if (filters.forToday) {
            const today = new Date().toISOString().split('T')[0];
            filteredAttendance = filteredAttendance.filter(r => r.date === today);
        }

        return filteredAttendance.sort((a, b) => b.timestamp - a.timestamp); // Most recent first
    }
}

module.exports = new StudentService();