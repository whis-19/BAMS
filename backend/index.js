const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const apiRoutes = require('./src/routes/apiRoutes');
// Ensure HierarchyManager is initialized to load data on startup
const hierarchyManager = require('./src/core/HierarchyManager');

// Initialize services with HierarchyManager
const departmentServiceFactory = require('./src/services/departmentService');
const classServiceFactory = require('./src/services/classService');
const studentServiceFactory = require('./src/services/studentService');

const departmentService = departmentServiceFactory(hierarchyManager);
const classService = classServiceFactory(hierarchyManager);
const studentService = studentServiceFactory(hierarchyManager);

// Export services globally for controllers to use
global.departmentService = departmentService;
global.classService = classService;
global.studentService = studentService;
global.hierarchyManager = hierarchyManager;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const corsOptions = {
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:8000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(bodyParser.json()); // To parse application/json requests

// Debug middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
    next();
});

// API Routes
app.use('/api', apiRoutes);

// Serve static files for the frontend (index.html, css, js)
app.use(express.static('frontend')); 

// Catch-all route for other GET requests (can serve index.html for SPA if needed)
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: 'frontend' });
});

// Basic Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something broke!', error: err.message });
});

// Start the server
const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Hierarchy Manager initialized and data loaded.');
});

// Handle server errors
server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

export default app;