// Services are initialized globally in index.js
const hierarchyManager = require('../core/HierarchyManager');

const bamsController = {
    /**
     * Runs the multi-level validation logic on the entire hierarchy.
     */
    async validateHierarchy(req, res) {
        try {
            const result = global.hierarchyManager.validateHierarchy();
            if (result.isValid) {
                res.status(200).json(result);
            } else {
                // Return 400 or 409 status to indicate a structural/data conflict/tampering
                res.status(409).json(result); 
            }
        } catch (error) {
            res.status(500).json({ message: 'Error validating hierarchy.', error: error.message });
        }
    },
    
    /**
     * Provides a consolidated view of the entire blockchain structure for the explorer.
     */
    async getBlockchainExplorerData(req, res) {
        try {
            // Must return the raw chains data for the explorer to display the blocks
            const departments = global.hierarchyManager.getDepartmentChains();
            const classes = global.hierarchyManager.getClassChains();
            const students = global.hierarchyManager.getStudentChains();
            
            const data = {
                departments: Object.values(departments).map(d => d.toJSON()),
                classes: Object.values(classes).map(c => c.toJSON()),
                students: Object.values(students).map(s => s.toJSON())
            };
            
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: 'Error getting blockchain explorer data.', error: error.message });
        }
    },

    /**
     * Gets filtered attendance records. [cite: 41]
     */
    async getAttendanceRecords(req, res) {
        try {
            const filters = req.query; // e.g., { date: '2025-01-01', classId: '...', departmentId: '...', forToday: 'true' }
            const records = global.studentService.getFilteredAttendance(filters);
            res.status(200).json(records);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving attendance records.', error: error.message });
        }
    }
};

module.exports = bamsController;