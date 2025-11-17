const crypto = require('crypto');
const DIFFICULTY = '0000'; // PoW requirement [cite: 95]

/**
 * Represents a single Block in the Blockchain.
 * Can hold Department, Class, Student metadata, or Attendance transactions. [cite: 81, 100]
 */
class Block {
    constructor(index, transactions, prev_hash = '', timestamp = null) {
        this.index = index; // Block number [cite: 100]
        this.timestamp = timestamp || Date.now(); // Use provided timestamp or current time
        this.transactions = transactions; // Data (attendance or metadata) [cite: 81, 100]
        this.prev_hash = prev_hash; // Previous block hash [cite: 100]
        this.nonce = 0; // PoW nonce [cite: 100]
        this.hash = this.calculateHash(); // Final computed hash [cite: 100]
        
    }

    /**
     * Calculates the SHA-256 hash for the block.
     * Includes: timestamp, transaction payload, previous hash, and nonce. [cite: 114, 115, 116, 117, 118]
     * @returns {string} The computed hash.
     */
    calculateHash() {
        const data = this.index + this.prev_hash + this.timestamp + JSON.stringify(this.transactions) + this.nonce;
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Mines the block using Proof of Work.
     * Continuously modifies the nonce until the hash starts with DIFFICULTY ('0000'). [cite: 94, 95]
     */
    mineBlock() {
        while (this.hash.substring(0, DIFFICULTY.length) !== DIFFICULTY) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
        console.log(`Block Mined! Hash: ${this.hash}, Nonce: ${this.nonce}`);
    }

    /**
     * Validates if the block's PoW is correct.
     * @returns {boolean} True if the hash is valid, false otherwise.
     */
    isPoWValid() {
        return this.hash.substring(0, DIFFICULTY.length) === DIFFICULTY;
    }

    /**
     * Re-calculates the hash of the block without changing the nonce/timestamp.
     * Useful for chain validation.
     * @returns {string} The re-computed hash.
     */
    recalculateHash() {
        const data = this.index + this.prev_hash + this.timestamp + JSON.stringify(this.transactions) + this.nonce;
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}

module.exports = Block;