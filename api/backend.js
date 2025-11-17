// Shim for Vercel: expose the Express app from backend as a serverless function
// Vercel will detect files under /api as serverless functions.

const app = require('../backend/index');

module.exports = app;
