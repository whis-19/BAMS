// Student Service - Working with HierarchyManager
module.exports = (Hierarchy) => {
    if (!Hierarchy || !Hierarchy.chains) {
        throw new Error('Invalid Hierarchy object provided to studentService');
    }

    const generateId = () => Math.random().toString(36).substr(2, 9);

    return {
        // Create a new student
// In studentService.js
createStudent: async (name, rollNumber, departmentId, classId) => {
    try {
        console.log('[STUDENT_SERVICE] createStudent called with:', { name, rollNumber, departmentId, classId });
        
        // Check if department exists
        if (!Hierarchy.chains.departments[departmentId]) {
            throw new Error(`Department ${departmentId} not found`);
        }
        
        // Check if class exists and belongs to the department
        if (!Hierarchy.chains.classes[classId]) {
            throw new Error(`Class ${classId} not found`);
        }
        
        const classChain = Hierarchy.chains.classes[classId];
        const classDept = classChain.getLatestBlock().transactions.departmentId;
        if (classDept !== departmentId) {
            throw new Error(`Class ${classId} does not belong to department ${departmentId}`);
        }
        
        // Check for duplicate roll number in the same class
        const existingStudents = Object.values(Hierarchy.chains.students);
        const isDuplicate = existingStudents.some(student => {
            const latestTx = student.getLatestBlock().transactions;
            return latestTx.rollNumber === rollNumber && 
                   latestTx.classId === classId &&
                   latestTx.status !== 'deleted';
        });

        if (isDuplicate) {
            throw new Error(`A student with roll number "${rollNumber}" already exists in this class`);
        }
        
        const studentId = `STU_${generateId().toUpperCase()}`;
        Hierarchy.createStudentChain(studentId, classId);
        const chain = Hierarchy.chains.students[studentId];
        
        const metaBlock = chain.addBlock({
            type: 'CREATE_STUDENT',
            name: name,
            rollNumber: rollNumber,
            departmentId: departmentId,
            classId: classId,
            timestamp: Date.now(),
            status: 'active'
        });
        
        await Hierarchy.saveChains();
        return {
            id: studentId,
            name: name,
            rollNumber: rollNumber,
            departmentId: departmentId,
            classId: classId,
            status: 'active',
            latestBlockHash: chain.getLatestBlock().hash
        };
    } catch (err) {
        console.error('[STUDENT_SERVICE] Error in createStudent:', err.message);
        throw err;
    }
},

        // Get all students (optionally filter by class or department)
        getStudents: (classId = null, departmentId = null) => {
            try {
                const students = [];
                for (const studentId in Hierarchy.chains.students) {
                    const chain = Hierarchy.chains.students[studentId];
                    const latestTx = chain.getLatestBlock().transactions;
                    
                    if (latestTx.status === 'deleted' || String(latestTx.type || '').includes('DELETE')) {
                        continue;
                    }
                    
                    // Filter by class if specified
                    if (classId && latestTx.classId !== classId) {
                        continue;
                    }
                    
                    // Filter by department if specified
                    if (departmentId && latestTx.departmentId !== departmentId) {
                        continue;
                    }
                    
                    const initialTx = chain.chain[0].transactions;
                    students.push({
                        id: studentId,
                        name: latestTx.name || initialTx.name || 'Unnamed',
                        rollNumber: latestTx.rollNumber || initialTx.rollNumber,
                        departmentId: latestTx.departmentId || initialTx.departmentId,
                        classId: latestTx.classId || initialTx.classId,
                        status: latestTx.status || 'active',
                        latestBlockHash: chain.getLatestBlock().hash
                    });
                }
                return students;
            } catch (err) {
                console.error('[STUDENT_SERVICE] Error in getStudents:', err.message);
                throw err;
            }
        },

        // Get single student
        getStudentById: (id) => {
            try {
                const chain = Hierarchy.chains.students[id];
                if (!chain) return null;
                
                const latestTx = chain.getLatestBlock().transactions;
                if (latestTx.status === 'deleted' || String(latestTx.type || '').includes('DELETE')) {
                    return null;
                }
                
                const initialTx = chain.chain[0].transactions;
                return {
                    id: id,
                    name: latestTx.name || initialTx.name || 'Unnamed',
                    rollNumber: latestTx.rollNumber || initialTx.rollNumber,
                    departmentId: latestTx.departmentId || initialTx.departmentId,
                    classId: latestTx.classId || initialTx.classId,
                    status: latestTx.status || 'active',
                    latestBlockHash: chain.getLatestBlock().hash
                };
            } catch (err) {
                console.error('[STUDENT_SERVICE] Error in getStudentById:', err.message);
                throw err;
            }
        },

        // Update student
        updateStudent: async (id, updates) => {
            try {
                const chain = Hierarchy.chains.students[id];
                if (!chain) throw new Error(`Student ${id} not found`);
                
                const newBlock = chain.addBlock({
                    type: 'UPDATE_STUDENT',
                    ...updates,
                    timestamp: Date.now()
                });
                
                await Hierarchy.saveChains();
                return newBlock;
            } catch (err) {
                console.error('[STUDENT_SERVICE] Error in updateStudent:', err.message);
                throw err;
            }
        },

        // Delete student
        deleteStudent: async (id) => {
            try {
                const chain = Hierarchy.chains.students[id];
                if (!chain) throw new Error(`Student ${id} not found`);
                
                const deleteBlock = chain.addBlock({
                    type: 'DELETE_STUDENT',
                    status: 'deleted',
                    timestamp: Date.now()
                });
                
                await Hierarchy.saveChains();
                return deleteBlock;
            } catch (err) {
                console.error('[STUDENT_SERVICE] Error in deleteStudent:', err.message);
                throw err;
            }
        },

        // Search students
        searchStudents: (query) => {
            try {
                const lowerQuery = query.toLowerCase();
                const results = [];
                for (const studentId in Hierarchy.chains.students) {
                    const chain = Hierarchy.chains.students[studentId];
                    const latestTx = chain.getLatestBlock().transactions;
                    
                    if (latestTx.status === 'deleted' || String(latestTx.type || '').includes('DELETE')) {
                        continue;
                    }
                    
                    const name = latestTx.name || chain.chain[0].transactions.name || '';
                    const rollNumber = latestTx.rollNumber || chain.chain[0].transactions.rollNumber || '';
                    
                    if (name.toLowerCase().includes(lowerQuery) || 
                        rollNumber.toLowerCase().includes(lowerQuery) || 
                        studentId.toLowerCase().includes(lowerQuery)) {
                        results.push({
                            id: studentId,
                            name: name,
                            rollNumber: rollNumber,
                            departmentId: latestTx.departmentId,
                            classId: latestTx.classId,
                            status: latestTx.status || 'active',
                            latestBlockHash: chain.getLatestBlock().hash
                        });
                    }
                }
                return results;
            } catch (err) {
                console.error('[STUDENT_SERVICE] Error in searchStudents:', err.message);
                throw err;
            }
        },

        // Mark attendance
markAttendance: async (studentId, status) => {
    try {
        const chain = Hierarchy.chains.students[studentId];
        if (!chain) throw new Error(`Student ${studentId} not found`);
        
        // Get student details from the latest block that has them
        let studentName = 'Unknown';
        let rollNumber = studentId;
        let departmentId = null;
        let classId = null;
        
        // First, try to get from the latest block that has the information
        for (let i = chain.chain.length - 1; i >= 0; i--) {
            const tx = chain.chain[i].transactions;
            if (tx.name) studentName = tx.name;
            if (tx.rollNumber) rollNumber = tx.rollNumber;
            if (tx.departmentId) departmentId = tx.departmentId;
            if (tx.classId) classId = tx.classId;
            
            // If we've found all the required fields, we can break early
            if (studentName !== 'Unknown' && rollNumber && departmentId && classId) {
                break;
            }
        }
        
        // If we still don't have all the information, try to get from the class chain
        if ((!departmentId || !classId) && chain.classId) {
            const classChain = Hierarchy.chains.classes[chain.classId];
            if (classChain) {
                const classTx = classChain.chain[0].transactions; // Get from creation block
                if (!departmentId && classTx.departmentId) {
                    departmentId = classTx.departmentId;
                }
                if (!classId) {
                    classId = chain.classId;
                }
            }
        }
        
        const attendanceBlock = chain.addBlock({
            type: 'ATTENDANCE_MARK',
            status: status,
            timestamp: Date.now(),
            date: new Date().toISOString().split('T')[0],
            // Include all student details in the attendance record
            name: studentName,
            studentName: studentName,
            rollNumber: rollNumber,
            departmentId: departmentId,
            classId: classId
        });
        
        await Hierarchy.saveChains();
        return attendanceBlock;
    } catch (err) {
        console.error('[STUDENT_SERVICE] Error in markAttendance:', err.message);
        throw err;
    }
},

        // Get student attendance
        getStudentAttendance: (id) => {
            try {
                const chain = Hierarchy.chains.students[id];
                if (!chain) return null;
                
                // Get student details from the latest block that has them
                let studentName = 'Unknown';
                let rollNumber = id;
                let departmentId = null;
                let classId = null;
                
                // First, try to get from the latest block that has the information
                for (let i = chain.chain.length - 1; i >= 0; i--) {
                    const tx = chain.chain[i].transactions;
                    if (tx.name) studentName = tx.name;
                    if (tx.rollNumber) rollNumber = tx.rollNumber;
                    if (tx.departmentId) departmentId = tx.departmentId;
                    if (tx.classId) classId = tx.classId;
                    
                    // If we've found all the required fields, we can break early
                    if (studentName !== 'Unknown' && rollNumber && departmentId && classId) {
                        break;
                    }
                }
                
                // If we still don't have all the information, try to get from the class chain
                if ((!departmentId || !classId) && chain.classId) {
                    const classChain = Hierarchy.chains.classes[chain.classId];
                    if (classChain) {
                        const classTx = classChain.chain[0].transactions; // Get from creation block
                        if (!departmentId && classTx.departmentId) {
                            departmentId = classTx.departmentId;
                        }
                        if (!classId) {
                            classId = chain.classId;
                        }
                    }
                }
                
                const attendance = [];
                for (let i = 0; i < chain.chain.length; i++) {
                    const block = chain.chain[i];
                    if (block.transactions.type === 'ATTENDANCE_MARK') {
                        attendance.push({
                            date: block.transactions.date,
                            status: block.transactions.status,
                            blockIndex: block.index,
                            timestamp: block.transactions.timestamp,
                            studentId: id,
                            studentName: studentName,
                            rollNumber: rollNumber,
                            departmentId: departmentId,
                            classId: classId
                        });
                    }
                }
                return attendance;
            } catch (err) {
                console.error('[STUDENT_SERVICE] Error in getStudentAttendance:', err.message);
                throw err;
            }
        }
    };
};