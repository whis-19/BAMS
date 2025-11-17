const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');

// CRUD operations - Classes [cite: 33, 42]
router.post('/', classController.createClass); // Create (links to Department) [cite: 57]
router.get('/', classController.getClasses); // Read all (can filter by departmentId query param)
router.get('/search', classController.searchClasses); // Search [cite: 35]
router.get('/:id', classController.getClass); // Read one
router.put('/:id', classController.updateClass); // Update (adds new block) [cite: 59]
router.delete('/:id', classController.deleteClass); // Delete (adds new block) [cite: 59]

module.exports = router;