// 1. Get the built-in crypto module
const { createHash } = require('crypto');

class Block {
    /**
     * @param {number} index - Block number
     * @param {number} timestamp - System time
     * @param {any} transactions - Data (attendance, metadata, etc.) [cite: 96]
     * @param {string} prev_hash - Previous block hash [cite: 96]
     */
    constructor(index, timestamp, transactions, prev_hash = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.prev_hash = prev_hash;
        
        // These are required for mining
        this.nonce = 0; // [cite: 96]
        this.hash = this.calculateHash(); // [cite: 96]
    }

    /**
     * Calculates the SHA-256 hash of the block.
     * The hash must include timestamp, transactions, prev_hash, and nonce. [cite: 88, 110-114]
     */
    calculateHash() {
        // We stringify transactions to ensure consistent hashing
        const data = this.index + this.prev_hash + this.timestamp + JSON.stringify(this.transactions) + this.nonce;
        
        // 2. Use the built-in crypto module
        return createHash('sha256').update(data).digest('hex');
    }

    /**
     * Implements the Proof of Work (PoW) mechanism.
     * Keeps changing the nonce until the hash starts with "0000". [cite: 90, 91]
     * @param {number} difficulty - The number of leading zeros (e.g., 4)
     */
    mineBlock(difficulty) {
        // Create the string of leading zeros for the check
        const target = '0'.repeat(difficulty);
        
        while (this.hash.substring(0, difficulty) !== target) {
            this.nonce++; // Modify the nonce [cite: 91]
            this.hash = this.calculateHash();
        }
        
        // console.log(`Block Mined: ${this.hash}`); // Optional: for debugging
    }
}

// Export the class
module.exports = Block;