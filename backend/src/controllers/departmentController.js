// Services are initialized globally in index.js

// Handles exceptions and wraps service logic in try/catch for robust API
const departmentController = {
    async createDepartment(req, res) {
        try {
            const { name } = req.body;
            if (!name) {
                return res.status(400).json({ message: 'Department name is required.' });
            }
            const result = await global.departmentService.createDepartment(name);
            res.status(201).json({ message: 'Department created successfully.', data: result });
        } catch (error) {
            res.status(500).json({ message: 'Error creating department.', error: error.message });
        }
    },

    async getDepartments(req, res) {
        try {
            const departments = global.departmentService.getDepartments();
            res.status(200).json(departments);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving departments.', error: error.message });
        }
    },
    
    async getDepartment(req, res) {
        try {
            const { id } = req.params;
            const department = global.departmentService.getDepartmentById(id);
            if (!department) {
                return res.status(404).json({ message: 'Department not found.' });
            }
            // Return Department metadata (excluding the chain object)
            const { chain, ...data } = department;
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving department.', error: error.message });
        }
    },

    async updateDepartment(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            if (Object.keys(updates).length === 0) {
                 return res.status(400).json({ message: 'No update fields provided.' });
            }
            const newBlock = await global.departmentService.updateDepartment(id, updates);
            res.status(200).json({ message: `Department ${id} updated. New block added.`, newBlock });
        } catch (error) {
            res.status(500).json({ message: 'Error updating department.', error: error.message });
        }
    },

    async deleteDepartment(req, res) {
        try {
            const { id } = req.params;
            const newBlock = await global.departmentService.deleteDepartment(id);
            res.status(200).json({ message: `Department ${id} marked as deleted. New block added.`, newBlock });
        } catch (error) {
            res.status(500).json({ message: 'Error deleting department.', error: error.message });
        }
    },
    
    async searchDepartments(req, res) {
        try {
            const { q } = req.query;
            if (!q) {
                return res.status(400).json({ message: 'Search query (q) is required.' });
            }
            const results = global.departmentService.searchDepartments(q);
            res.status(200).json(results);
        } catch (error) {
            res.status(500).json({ message: 'Error searching departments.', error: error.message });
        }
    }
};

module.exports = departmentController;