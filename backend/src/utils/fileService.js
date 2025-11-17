const fs = require('fs').promises;
const path = require('path');

const dataDir = path.join(__dirname, '..', '..', 'data');
const fullPath = (filename) => path.join(dataDir, filename);

/**
 * Ensures the data directory exists.
 */
async function ensureDataDir() {
    try {
        await fs.mkdir(dataDir, { recursive: true });
    } catch (error) {
        console.error("Error ensuring data directory exists:", error);
    }
}

/**
 * Reads blockchain data from a file.
 * @param {string} filename - The name of the data file.
 * @returns {Promise<object | null>} The parsed data or null if file not found.
 */
async function readBlockchainData(filename) {
    await ensureDataDir();
    try {
        const data = await fs.readFile(fullPath(filename), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`Data file ${filename} not found. Returning empty structure.`);
            return { departments: {}, classes: {}, students: {} }; // Initial empty structure
        }
        console.error(`Error reading data file ${filename}:`, error);
        throw error; // Re-throw other errors
    }
}

/**
 * Writes blockchain data to a file.
 * @param {string} filename - The name of the data file.
 * @param {object} data - The data to write.
 */
async function writeBlockchainData(filename, data) {
    await ensureDataDir();
    try {
        await fs.writeFile(fullPath(filename), JSON.stringify(data, null, 4), 'utf8');
        console.log(`Blockchain data saved to ${filename}.`);
    } catch (error) {
        console.error(`Error writing data file ${filename}:`, error);
        throw error;
    }
}

module.exports = {
    readBlockchainData,
    writeBlockchainData
};