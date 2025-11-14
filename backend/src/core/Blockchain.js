const Block = require('./Block.js');

class Blockchain {
    /**
     * @param {string} [genesis_prev_hash=null] - Optional prev_hash for linking chains.
     * @param {any} [genesis_data='Genesis Block'] - Data for the first block.
     */
    constructor(genesis_prev_hash = null, genesis_data = 'Genesis Block') {
        // Difficulty for the Proof of Work (must start with "0000") [cite: 91]
        this.difficulty = 4;
        
        // The chain is an array of blocks, starting with the Genesis block
        this.chain = [this.createGenesisBlock(genesis_prev_hash, genesis_data)];
    }

    /**
     * Creates the very first block (index 0) in the chain.
     * @param {string} prev_hash - For Layer 2/3 chains, this is the parent's hash.
     * @param {any} data - The transaction data for the genesis block.
     */
    createGenesisBlock(prev_hash, data) {
        // If prev_hash is null, it's a Layer 1 chain (Department).
        // If it's provided, it links this chain to a parent. [cite: 102, 105]
        const effective_prev_hash = prev_hash === null ? "0" : prev_hash;
        
        let genesisBlock = new Block(0, Date.now(), data, effective_prev_hash);
        
        // Even the genesis block must be "mined"
        // console.log("Mining Genesis Block..."); // Optional: for debugging
        genesisBlock.mineBlock(this.difficulty);
        
        return genesisBlock;
    }

    /**
     * Gets the most recent block on the chain.
     */
    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    /**
     * Creates a new block, mines it, and adds it to the chain.
     * @param {any} transactionData - The data to add [cite: 36, 77]
     */
    addBlock(transactionData) {
        const latestBlock = this.getLatestBlock();
        
        // Create the new block
        let newBlock = new Block(
            latestBlock.index + 1,
            Date.now(),
            transactionData,
            latestBlock.hash // The new block's prev_hash is the *current* latest block's hash
        );

        // Mine the new block
        // console.log(`Mining block ${newBlock.index}...`); // Optional: for debugging
        newBlock.mineBlock(this.difficulty);
        
        // Add it to the chain
        this.chain.push(newBlock);
    }

    /**
     * Validates the integrity of the entire blockchain. [cite: 93]
     */
    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            // 1. Check if the stored hash is correct by recalculating it [cite: 93]
            if (currentBlock.hash !== currentBlock.calculateHash()) {
                console.error(`Validation Error: Hash mismatch on block ${currentBlock.index}`);
                return false;
            }

            // 2. Check if it points to the correct previous block [cite: 93]
            if (currentBlock.prev_hash !== previousBlock.hash) {
                console.error(`Validation Error: Previous hash mismatch on block ${currentBlock.index}`);
                return false;
            }
            
            // 3. Check if the PoW is valid [cite: 93]
            const target = '0'.repeat(this.difficulty);
            if (currentBlock.hash.substring(0, this.difficulty) !== target) {
                console.error(`Validation Error: Proof of Work invalid on block ${currentBlock.index}`);
                return false;
            }
        }
        
        // If all blocks are valid
        return true;
    }
}

module.exports = Blockchain;