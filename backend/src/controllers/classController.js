// Services are initialized globally in index.js

const classController = {
    async createClass(req, res) {
        try {
            const { name, departmentId } = req.body;
            if (!name || !departmentId) {
                return res.status(400).json({ message: 'Class name and departmentId are required.' });
            }
            const result = await global.classService.createClass(name, departmentId);
            res.status(201).json({ message: 'Class created successfully.', data: result });
        } catch (error) {
            res.status(500).json({ message: 'Error creating class.', error: error.message });
        }
    },

    async getClasses(req, res) {
        try {
            const { departmentId } = req.query;
            const classes = global.classService.getClasses(departmentId);
            res.status(200).json(classes);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving classes.', error: error.message });
        }
    },
    
    async getClass(req, res) {
        try {
            const { id } = req.params;
            const classObj = global.classService.getClassById(id);
            if (!classObj) {
                return res.status(404).json({ message: 'Class not found.' });
            }
            const { chain, ...data } = classObj;
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving class.', error: error.message });
        }
    },

    async updateClass(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            if (Object.keys(updates).length === 0) {
                 return res.status(400).json({ message: 'No update fields provided.' });
            }
            const newBlock = await global.classService.updateClass(id, updates);
            res.status(200).json({ message: `Class ${id} updated. New block added.`, newBlock });
        } catch (error) {
            res.status(500).json({ message: 'Error updating class.', error: error.message });
        }
    },

    async deleteClass(req, res) {
        try {
            const { id } = req.params;
            const newBlock = await global.classService.deleteClass(id);
            res.status(200).json({ message: `Class ${id} marked as deleted. New block added.`, newBlock });
        } catch (error) {
            res.status(500).json({ message: 'Error deleting class.', error: error.message });
        }
    },
    
    async searchClasses(req, res) {
        try {
            const { q } = req.query;
            if (!q) {
                return res.status(400).json({ message: 'Search query (q) is required.' });
            }
            const results = global.classService.searchClasses(q);
            res.status(200).json(results);
        } catch (error) {
            res.status(500).json({ message: 'Error searching classes.', error: error.message });
        }
    }
};

module.exports = classController;