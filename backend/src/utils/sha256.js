const crypto = require('crypto');

/**
 * Calculates the SHA-256 hash for a given string input.
 * This function is used by the Block class.
 * @param {string} input - The concatenated data string (timestamp + transactions + prev_hash + nonce).
 * @returns {string} The resulting SHA-256 hash in hexadecimal format.
 */
function calculateHash(input) {
    return crypto.createHash('sha256').update(input).digest('hex');
}

module.exports = {
    calculateHash,
};