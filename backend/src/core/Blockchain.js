const Block = require('./Block');
const crypto = require('crypto');

/**
 * Manages a single chain of blocks (e.g., Department, Class, or Student Chain).
 */
class Blockchain {
    constructor(id = 'GENESIS_CHAIN', type = 'department', prev_hash = '') {
        this.id = id;
        this.type = type;
        this.chain = [];
        this.createGenesisBlock(prev_hash);
    }

    /**
     * Creates the first block of the chain.
     * For Class and Student chains, the prev_hash comes from the parent chain. [cite: 105, 106, 108, 109]
     * @param {string} parentHash - The hash of the parent chain's last block.
     */
    createGenesisBlock(parentHash) {
        const genesisData = {
            message: `${this.type.toUpperCase()} Genesis Block`,
            id: this.id,
            type: this.type,
            creationDate: new Date().toISOString()
        };
        const genesisBlock = new Block(0, genesisData, parentHash);
        genesisBlock.mineBlock(); // PoW on Genesis block
        this.chain.push(genesisBlock);
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    /**
     * Adds a new block (transaction/metadata update) to the chain.
     * @param {object} transactions - The data to include in the block.
     * @returns {Block} The newly added and mined block.
     */
    addBlock(transactions) {
        const latestBlock = this.getLatestBlock();
        const newBlock = new Block(
            latestBlock.index + 1,
            transactions,
            latestBlock.hash
        );
        newBlock.mineBlock();
        this.chain.push(newBlock);
        return newBlock;
    }

    /**
     * Checks if the chain is valid (hashes match and PoW holds). [cite: 97]
     * @returns {boolean} True if the chain is valid, false otherwise.
     */
    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            // 1. Check if the current block's hash is correctly computed (PoW validation is part of this check)
            if (currentBlock.hash !== currentBlock.recalculateHash()) {
                console.error(`Chain ID: ${this.id}, Block ${currentBlock.index} hash is invalid.`);
                return false;
            }

            // 2. Check if the previous hash links correctly
            if (currentBlock.prev_hash !== previousBlock.hash) {
                console.error(`Chain ID: ${this.id}, Block ${currentBlock.index} is not linked correctly.`);
                return false;
            }

            // 3. Check PoW condition explicitly (redundant if recalculateHash works, but good for clarity) [cite: 128]
            if (!currentBlock.isPoWValid()) {
                console.error(`Chain ID: ${this.id}, Block ${currentBlock.index} PoW invalid.`);
                return false;
            }
        }
        return true;
    }
    
    /**
     * Converts the chain to a JSON object array for storage/transfer.
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            chain: this.chain.map(block => ({
                index: block.index,
                timestamp: block.timestamp,
                transactions: block.transactions,
                prev_hash: block.prev_hash,
                nonce: block.nonce,
                hash: block.hash
            }))
        };
    }
}

module.exports = Blockchain;