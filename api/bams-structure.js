const path = require('path');
const fs = require('fs');

module.exports = (req, res) => {
    try {
        // Determine the correct path to the data file
        const dataPath = process.env.VERCEL === '1'
            ? path.join('/tmp/backend/data/bams_structure.json')
            : path.join(process.cwd(), 'backend/data/bams_structure.json');

        // Check if file exists
        if (!fs.existsSync(dataPath)) {
            // If in Vercel and file doesn't exist in /tmp, try to copy from project files
            if (process.env.VERCEL === '1') {
                const sourcePath = path.join(process.cwd(), 'backend/data/bams_structure.json');
                if (fs.existsSync(sourcePath)) {
                    // Ensure directory exists
                    const dir = path.dirname(dataPath);
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                    // Copy file to /tmp
                    fs.copyFileSync(sourcePath, dataPath);
                } else {
                    return res.status(404).json({ 
                        error: 'Data file not found',
                        details: `Neither ${dataPath} nor ${sourcePath} exists`
                    });
                }
            } else {
                return res.status(404).json({ 
                    error: 'Data file not found',
                    path: dataPath
                });
            }
        }

        // Read and return the data
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        res.json(data);
    } catch (error) {
        console.error('Error in bams-structure endpoint:', error);
        res.status(500).json({
            error: 'Failed to load BAMS structure',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
