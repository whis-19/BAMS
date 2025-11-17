const hierarchyManager = require('../core/HierarchyManager');

class DepartmentService {
    /**
     * Creates a new department and its genesis chain.
     * @param {string} name
     * @returns {Promise<object>}
     */
    async createDepartment(name) {
        const id = name.toLowerCase().replace(/\s/g, '_');
        if (hierarchyManager.getChain('departments', id)) {
            throw new Error('Department already exists.');
        }

        const newChain = hierarchyManager.createDepartmentChain(id);
        
        // Add a block to store the actual metadata (optional, can be in genesis)
        const metadata = { name, status: 'active' };
        newChain.addBlock({ type: 'metadata', data: metadata, action: 'CREATE' });
        
        await hierarchyManager.saveChains();
        return { id, chainLength: newChain.chain.length, genesisHash: newChain.chain[0].hash };
    }

    /**
     * Retrieves the current (latest) state of all departments.
     * @returns {object[]} Array of department objects with latest metadata.
     */
    getDepartments() {
        const departments = [];
        const chains = hierarchyManager.getDepartmentChains();

        for (const id in chains) {
            const chain = chains[id].chain;
            // Find the most recent active/non-deleted metadata block [cite: 75]
            const latestBlock = chain.slice().reverse().find(b => 
                b.transactions.type === 'metadata' && b.transactions.data.status !== 'deleted'
            );
            
            if (latestBlock) {
                departments.push({
                    id: chains[id].id,
                    ...latestBlock.transactions.data,
                    latestBlockHash: latestBlock.hash
                });
            }
        }
        return departments;
    }
    
    /**
     * Finds a department by name/ID, reading the most recent block.
     * @param {string} id
     * @returns {object | null}
     */
    getDepartmentById(id) {
        const chain = hierarchyManager.getChain('departments', id);
        if (!chain) return null;

        // Find the most recent block that is not 'deleted'
        const latestBlock = chain.chain.slice().reverse().find(b => 
            b.transactions.type === 'metadata' && b.transactions.data.status !== 'deleted'
        );

        return latestBlock ? { id, ...latestBlock.transactions.data, chain } : null;
    }

    /**
     * Updates a department by appending a new block with updated metadata. [cite: 46, 47, 48, 50, 51]
     * @param {string} id
     * @param {object} updates
     * @returns {Promise<object>} The new block.
     */
    async updateDepartment(id, updates) {
        const department = this.getDepartmentById(id);
        if (!department) {
            throw new Error(`Department ${id} not found.`);
        }

        const departmentChain = hierarchyManager.getChain('departments', id);
        const newMetadata = { ...department.data, ...updates };

        // New block with updated fields and action
        const newBlock = departmentChain.addBlock({ 
            type: 'metadata', 
            data: newMetadata, 
            action: 'UPDATE' 
        });

        await hierarchyManager.saveChains();
        return newBlock;
    }

    /**
     * "Deletes" a department by appending a new block with status: "deleted". [cite: 46, 48, 49, 51]
     * @param {string} id
     * @returns {Promise<object>} The new block.
     */
    async deleteDepartment(id) {
        const department = this.getDepartmentById(id);
        if (!department) {
            throw new Error(`Department ${id} not found.`);
        }

        const departmentChain = hierarchyManager.getChain('departments', id);
        const deletedMetadata = { ...department.data, status: 'deleted' };

        // New block with deleted status
        const newBlock = departmentChain.addBlock({ 
            type: 'metadata', 
            data: deletedMetadata, 
            action: 'DELETE' 
        });

        await hierarchyManager.saveChains();
        return newBlock;
    }
    
    /**
     * Searches departments by name.
     * @param {string} searchTerm
     * @returns {object[]}
     */
    searchDepartments(searchTerm) {
        const term = searchTerm.toLowerCase();
        return this.getDepartments().filter(dept => 
            dept.name.toLowerCase().includes(term) || dept.id.includes(term)
        );
    }
}

module.exports = new DepartmentService();