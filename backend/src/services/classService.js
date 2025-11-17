// Class Service - Working with HierarchyManager
module.exports = (Hierarchy) => {
    if (!Hierarchy || !Hierarchy.chains) {
        throw new Error('Invalid Hierarchy object provided to classService');
    }

    const generateId = () => Math.random().toString(36).substr(2, 9);

    return {
        // Create a new class
// In classService.js
createClass: async (name, departmentId) => {
    try {
        console.log('[CLASS_SERVICE] createClass called with:', { name, departmentId });
        
        // Check if department exists
        if (!Hierarchy.chains.departments[departmentId]) {
            throw new Error(`Department ${departmentId} not found`);
        }

        // Check for duplicate class name in the same department
        const existingClasses = Object.values(Hierarchy.chains.classes);
        const isDuplicate = existingClasses.some(cls => {
            const latestTx = cls.getLatestBlock().transactions;
            return latestTx.name === name && 
                   latestTx.departmentId === departmentId &&
                   latestTx.status !== 'deleted';
        });

        if (isDuplicate) {
            throw new Error(`A class with name "${name}" already exists in this department`);
        }

        const classId = `CLASS_${generateId().toUpperCase()}`;
        Hierarchy.createClassChain(classId, departmentId);
        const chain = Hierarchy.chains.classes[classId];
        
        const metaBlock = chain.addBlock({
            type: 'CREATE_CLASS',
            name: name,
            departmentId: departmentId,
            timestamp: Date.now(),
            status: 'active'
        });
        
        await Hierarchy.saveChains();
        return {
            id: classId,
            name: name,
            departmentId: departmentId,
            status: 'active',
            latestBlockHash: chain.getLatestBlock().hash
        };
    } catch (err) {
        console.error('[CLASS_SERVICE] Error in createClass:', err.message);
        throw err;
    }
},

        // Get all classes (optionally filter by department)
        getClasses: (departmentId = null) => {
            try {
                const classes = [];
                for (const classId in Hierarchy.chains.classes) {
                    const chain = Hierarchy.chains.classes[classId];
                    const latestTx = chain.getLatestBlock().transactions;
                    
                    if (latestTx.status === 'deleted' || String(latestTx.type || '').includes('DELETE')) {
                        continue;
                    }
                    
                    // Filter by department if specified
                    if (departmentId && latestTx.departmentId !== departmentId) {
                        continue;
                    }
                    
                    const initialTx = chain.chain[0].transactions;
                    classes.push({
                        id: classId,
                        name: latestTx.name || initialTx.name || 'Unnamed',
                        departmentId: latestTx.departmentId || initialTx.departmentId,
                        status: latestTx.status || 'active',
                        latestBlockHash: chain.getLatestBlock().hash
                    });
                }
                return classes;
            } catch (err) {
                console.error('[CLASS_SERVICE] Error in getClasses:', err.message);
                throw err;
            }
        },

        // Get single class
        getClassById: (id) => {
            try {
                const chain = Hierarchy.chains.classes[id];
                if (!chain) return null;
                
                const latestTx = chain.getLatestBlock().transactions;
                if (latestTx.status === 'deleted' || String(latestTx.type || '').includes('DELETE')) {
                    return null;
                }
                
                const initialTx = chain.chain[0].transactions;
                return {
                    id: id,
                    name: latestTx.name || initialTx.name || 'Unnamed',
                    departmentId: latestTx.departmentId || initialTx.departmentId,
                    status: latestTx.status || 'active',
                    latestBlockHash: chain.getLatestBlock().hash
                };
            } catch (err) {
                console.error('[CLASS_SERVICE] Error in getClassById:', err.message);
                throw err;
            }
        },

        // Update class
        updateClass: async (id, updates) => {
            try {
                const chain = Hierarchy.chains.classes[id];
                if (!chain) throw new Error(`Class ${id} not found`);
                
                const newBlock = chain.addBlock({
                    type: 'UPDATE_CLASS',
                    ...updates,
                    timestamp: Date.now()
                });
                
                await Hierarchy.saveChains();
                return newBlock;
            } catch (err) {
                console.error('[CLASS_SERVICE] Error in updateClass:', err.message);
                throw err;
            }
        },

        // Delete class
        deleteClass: async (id) => {
            try {
                const chain = Hierarchy.chains.classes[id];
                if (!chain) throw new Error(`Class ${id} not found`);
                
                const deleteBlock = chain.addBlock({
                    type: 'DELETE_CLASS',
                    status: 'deleted',
                    timestamp: Date.now()
                });
                
                await Hierarchy.saveChains();
                return deleteBlock;
            } catch (err) {
                console.error('[CLASS_SERVICE] Error in deleteClass:', err.message);
                throw err;
            }
        },

        // Search classes
        searchClasses: (query) => {
            try {
                const lowerQuery = query.toLowerCase();
                const results = [];
                for (const classId in Hierarchy.chains.classes) {
                    const chain = Hierarchy.chains.classes[classId];
                    const latestTx = chain.getLatestBlock().transactions;
                    
                    if (latestTx.status === 'deleted' || String(latestTx.type || '').includes('DELETE')) {
                        continue;
                    }
                    
                    const name = latestTx.name || chain.chain[0].transactions.name || '';
                    if (name.toLowerCase().includes(lowerQuery) || classId.toLowerCase().includes(lowerQuery)) {
                        results.push({
                            id: classId,
                            name: name,
                            departmentId: latestTx.departmentId,
                            status: latestTx.status || 'active',
                            latestBlockHash: chain.getLatestBlock().hash
                        });
                    }
                }
                return results;
            } catch (err) {
                console.error('[CLASS_SERVICE] Error in searchClasses:', err.message);
                throw err;
            }
        }
    };
};