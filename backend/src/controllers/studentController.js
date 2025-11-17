// Services are initialized globally in index.js

const studentController = {
    async createStudent(req, res) {
        try {
            const { name, rollNumber, departmentId, classId } = req.body;
            console.log('[STUDENT_CONTROLLER] createStudent req.body:', req.body);
            if (!name || !rollNumber || !departmentId || !classId) {
                return res.status(400).json({ message: 'All student fields are required: name, rollNumber, departmentId, classId.' });
            }
            console.log('[STUDENT_CONTROLLER] calling studentService.createStudent with:', { name, rollNumber, departmentId, classId });
            const result = await global.studentService.createStudent(name, rollNumber, departmentId, classId);
            res.status(201).json({ message: 'Student created successfully.', data: result });
        } catch (error) {
            res.status(500).json({ message: 'Error creating student.', error: error.message });
        }
    },

    async getStudents(req, res) {
        try {
            const students = global.studentService.getStudents();
            res.status(200).json(students);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving students.', error: error.message });
        }
    },
    
    async getStudent(req, res) {
        try {
            const { id } = req.params;
            const student = global.studentService.getStudentById(id);
            if (!student) {
                return res.status(404).json({ message: 'Student not found.' });
            }
            const { chain, ...data } = student;
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving student.', error: error.message });
        }
    },

    async updateStudent(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            if (Object.keys(updates).length === 0) {
                 return res.status(400).json({ message: 'No update fields provided.' });
            }
            const newBlock = await global.studentService.updateStudent(id, updates);
            res.status(200).json({ message: `Student ${id} updated. New block added.`, newBlock });
        } catch (error) {
            res.status(500).json({ message: 'Error updating student.', error: error.message });
        }
    },

    async deleteStudent(req, res) {
        try {
            const { id } = req.params;
            const newBlock = await global.studentService.deleteStudent(id);
            res.status(200).json({ message: `Student ${id} marked as deleted. New block added.`, newBlock });
        } catch (error) {
            res.status(500).json({ message: 'Error deleting student.', error: error.message });
        }
    },
    
    async searchStudents(req, res) {
        try {
            const { q } = req.query;
            if (!q) {
                return res.status(400).json({ message: 'Search query (q) is required.' });
            }
            const results = global.studentService.searchStudents(q);
            res.status(200).json(results);
        } catch (error) {
            res.status(500).json({ message: 'Error searching students.', error: error.message });
        }
    },
    
    // --- Attendance Endpoints ---
    
    async markAttendance(req, res) {
        try {
            const { studentId, status } = req.body;
            if (!studentId || !status) {
                return res.status(400).json({ message: 'Student ID and status are required.' });
            }
            
            const newBlock = await global.studentService.markAttendance(studentId, status);
            res.status(201).json({ message: `Attendance marked for ${studentId}. Block Mined.`, newBlock });
        } catch (error) {
            res.status(500).json({ message: 'Error marking attendance.', error: error.message });
        }
    },
    
    async getStudentAttendance(req, res) {
        try {
            const { id } = req.params;
            const attendance = global.studentService.getStudentAttendance(id);
            res.status(200).json(attendance);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving student attendance.', error: error.message });
        }
    }
};

module.exports = studentController;