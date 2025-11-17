const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// CRUD operations - Students [cite: 33, 42]
router.post('/', studentController.createStudent); // Create (links to Class) [cite: 68]
router.get('/', studentController.getStudents); // Read all
router.get('/search', studentController.searchStudents); // Search [cite: 37]
router.get('/:id', studentController.getStudent); // Read one
router.put('/:id', studentController.updateStudent); // Update (adds new block) [cite: 70]
router.delete('/:id', studentController.deleteStudent); // Delete (adds new block) [cite: 70]

// Attendance System [cite: 76]
router.post('/attendance', studentController.markAttendance); // Mark attendance (mines a block) [cite: 40]
router.get('/:id/attendance', studentController.getStudentAttendance); // Student Attendance Ledger [cite: 38]

module.exports = router;