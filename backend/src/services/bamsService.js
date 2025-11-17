// Export a factory function that accepts the HierarchyManager instance
module.exports = (Hierarchy) => {
    return {
        // --- SYSTEM VALIDATION ---
        runFullValidation: () => {
            // HierarchyManager contains the full validation logic (isChainValid and linkage checks)
            return Hierarchy.validateAllChains();
        },
        
    };
};