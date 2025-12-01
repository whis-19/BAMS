const express = require('express');
const router = express.Router();

const departmentRoutes = require('./departmentRoutes');
const classRoutes = require('./classRoutes');
const studentRoutes = require('./studentRoutes');
const bamsController = require('../controllers/bamsController');

// Main API Endpoints
router.use('/departments', departmentRoutes);
router.use('/classes', classRoutes);
router.use('/students', studentRoutes);

// BAMS/Global Endpoints
router.get('/validate-hierarchy', bamsController.validateHierarchy);
router.get('/explorer', bamsController.getBlockchainExplorerData);
router.get('/attendance', bamsController.getAttendanceRecords);

module.exports = router;