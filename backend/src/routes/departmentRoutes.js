const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');

// CRUD operations - Departments [cite: 33, 42]
router.post('/', departmentController.createDepartment); // Create
router.get('/', departmentController.getDepartments); // Read all
router.get('/search', departmentController.searchDepartments); // Search [cite: 34]
router.get('/:id', departmentController.getDepartment); // Read one
router.put('/:id', departmentController.updateDepartment); // Update (adds new block) [cite: 44]
router.delete('/:id', departmentController.deleteDepartment); // Delete (adds new block) [cite: 46]

module.exports = router;