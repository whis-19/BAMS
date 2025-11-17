// Shim for Vercel: expose the Express app from backend as a serverless function
// Vercel will detect files under /api as serverless functions and route /api/* here.

const app = require('../backend/index.js');

// Export the Express app directly
module.exports = app;

