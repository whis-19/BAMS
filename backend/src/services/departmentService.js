// Department Service - Properly working with HierarchyManager
module.exports = (Hierarchy) => {
    if (!Hierarchy || !Hierarchy.chains || !Hierarchy.chains.departments) {
        throw new Error('Invalid Hierarchy object provided to departmentService');
    }

    // Generate simple UUID
    const generateId = () => Math.random().toString(36).substr(2, 9);

    return {
        // Create a new department
        createDepartment: async (name) => {
            try {
                const departmentId = `DEPT_${generateId().toUpperCase()}`;
                Hierarchy.createDepartmentChain(departmentId);
                const chain = Hierarchy.chains.departments[departmentId];
                // Add initial metadata block
                const metaBlock = chain.addBlock({
                    type: 'CREATE_DEPARTMENT',
                    name: name,
                    timestamp: Date.now(),
                    status: 'active'
                });
                await Hierarchy.saveChains();
                return {
                    id: departmentId,
                    name: name,
                    status: 'active',
                    latestBlockHash: chain.getLatestBlock().hash
                };
            } catch (err) {
                console.error('[DEPT_SERVICE] Error in createDepartment:', err.message);
                throw err;
            }
        },

        // Get all departments
        getDepartments: () => {
            try {
                const departments = [];
                for (const deptId in Hierarchy.chains.departments) {
                    const chain = Hierarchy.chains.departments[deptId];
                    const latestTx = chain.getLatestBlock().transactions;
                    
                    // Skip if marked as deleted
                    if (latestTx.status === 'deleted' || String(latestTx.type || '').includes('DELETE')) {
                        continue;
                    }
                    
                    const initialTx = chain.chain[0].transactions;
                    departments.push({
                        id: deptId,
                        name: latestTx.name || initialTx.name || 'Unnamed',
                        status: latestTx.status || 'active',
                        latestBlockHash: chain.getLatestBlock().hash
                    });
                }
                return departments;
            } catch (err) {
                console.error('[DEPT_SERVICE] Error in getDepartments:', err.message);
                throw err;
            }
        },

        // Get single department
        getDepartmentById: (id) => {
            try {
                const chain = Hierarchy.chains.departments[id];
                if (!chain) return null;
                
                const latestTx = chain.getLatestBlock().transactions;
                if (latestTx.status === 'deleted' || String(latestTx.type || '').includes('DELETE')) {
                    return null;
                }
                
                const initialTx = chain.chain[0].transactions;
                return {
                    id: id,
                    name: latestTx.name || initialTx.name || 'Unnamed',
                    status: latestTx.status || 'active',
                    latestBlockHash: chain.getLatestBlock().hash
                };
            } catch (err) {
                console.error('[DEPT_SERVICE] Error in getDepartmentById:', err.message);
                throw err;
            }
        },

        // Update department
        updateDepartment: async (id, updates) => {
            try {
                const chain = Hierarchy.chains.departments[id];
                if (!chain) throw new Error(`Department ${id} not found`);
                
                const transaction = {
                    type: 'UPDATE_DEPARTMENT',
                    ...updates,
                    timestamp: Date.now()
                };
                
                const newBlock = chain.addBlock(transaction);
                await Hierarchy.saveChains();
                return newBlock;
            } catch (err) {
                console.error('[DEPT_SERVICE] Error in updateDepartment:', err.message);
                throw err;
            }
        },

        // Delete department
        deleteDepartment: async (id) => {
            try {
                const chain = Hierarchy.chains.departments[id];
                if (!chain) throw new Error(`Department ${id} not found`);
                
                const deleteBlock = chain.addBlock({
                    type: 'DELETE_DEPARTMENT',
                    status: 'deleted',
                    timestamp: Date.now()
                });
                
                await Hierarchy.saveChains();
                return deleteBlock;
            } catch (err) {
                console.error('[DEPT_SERVICE] Error in deleteDepartment:', err.message);
                throw err;
            }
        },

        // Search departments
        searchDepartments: (query) => {
            try {
                const lowerQuery = query.toLowerCase();
                const results = [];
                for (const deptId in Hierarchy.chains.departments) {
                    const chain = Hierarchy.chains.departments[deptId];
                    const latestTx = chain.getLatestBlock().transactions;
                    
                    if (latestTx.status === 'deleted' || String(latestTx.type || '').includes('DELETE')) {
                        continue;
                    }
                    
                    const name = latestTx.name || chain.chain[0].transactions.name || '';
                    if (name.toLowerCase().includes(lowerQuery) || deptId.toLowerCase().includes(lowerQuery)) {
                        results.push({
                            id: deptId,
                            name: name,
                            status: latestTx.status || 'active',
                            latestBlockHash: chain.getLatestBlock().hash
                        });
                    }
                }
                return results;
            } catch (err) {
                console.error('[DEPT_SERVICE] Error in searchDepartments:', err.message);
                throw err;
            }
        }
    };
};