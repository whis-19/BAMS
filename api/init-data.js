const { writeFileSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const dataDir = join(process.cwd(), 'tmp');
    const dataPath = join(dataDir, 'bams_structure.json');
    
    // Create directory if it doesn't exist
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    // Import default data
    const defaultData = require('../backend/data/bams_structure.json');
    
    // Write to tmp directory
    writeFileSync(dataPath, JSON.stringify(defaultData, null, 2));
    
    res.status(200).json({ 
      success: true, 
      message: 'Data initialized successfully',
      path: dataPath
    });
  } catch (error) {
    console.error('Error initializing data:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
