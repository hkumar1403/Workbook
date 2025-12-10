import { create } from 'zustand';

/**
 * Zustand store for cell values - moved out of React Context
 * to prevent unnecessary rerenders. Each cell subscribes only
 * to its own value using selectors.
 */
export const useCellStore = create((set, get) => ({
  // Cell values: { cellId: rawValue, cellId_value: computedValue }
  cellValues: {},
  
  // Update a single cell value - optimized to only update changed values
  updateCell: (cellId, rawValue, computedValue = null) => {
    set((state) => {
      // Only update if value actually changed (prevents unnecessary rerenders)
      const currentRaw = state.cellValues[cellId];
      const currentComputed = state.cellValues[`${cellId}_value`];
      
      if (currentRaw === rawValue && currentComputed === computedValue) {
        return state; // No change, skip update
      }
      
      const updates = { [cellId]: rawValue };
      if (computedValue !== null) {
        updates[`${cellId}_value`] = computedValue;
      }
      return {
        cellValues: { ...state.cellValues, ...updates }
      };
    });
  },
  
  // Batch update multiple cells (for loading data)
  setCellValues: (newValues) => {
    set({ cellValues: newValues });
  },
  
  // Get a single cell's raw value
  getCellRaw: (cellId) => {
    return get().cellValues[cellId] ?? '';
  },
  
  // Get a single cell's computed value
  getCellComputed: (cellId) => {
    return get().cellValues[`${cellId}_value`];
  },
  
  // Get display value for a cell (raw if not formula, computed if formula)
  getCellDisplayValue: (cellId) => {
    const state = get();
    const raw = state.cellValues[cellId];
    const computed = state.cellValues[`${cellId}_value`];
    
    // Handle error objects that might have been stored
    if (computed !== undefined) {
      // Check if computed is an error object
      if (computed && typeof computed === 'object' && !Array.isArray(computed)) {
        // Extract error message or value from error object
        if (computed.value !== undefined) {
          return String(computed.value);
        } else if (computed.message !== undefined) {
          return String(computed.message);
        } else if (computed.type !== undefined) {
          return `#${computed.type}`;
        } else {
          return '';
        }
      }
      // Return computed value as string
      return String(computed);
    }
    if (!raw) return '';
    if (!raw.startsWith('=')) return raw;
    return '';
  },
  
  // Clear all cell values (for sheet switching)
  clearCells: () => {
    set({ cellValues: {} });
  }
}));

/**
 * Selector hooks for individual cells - only rerender when specific cell changes
 * These are optimized selectors that subscribe only to the cell's own values
 * Zustand will only trigger rerenders when the selected slice of state changes
 */
export const useCellDisplayValue = (cellId) => {
  return useCellStore((state) => {
    const raw = state.cellValues[cellId];
    const computed = state.cellValues[`${cellId}_value`];
    
    // Handle error objects that might have been stored
    if (computed !== undefined) {
      // Check if computed is an error object
      if (computed && typeof computed === 'object' && !Array.isArray(computed)) {
        // Extract error message or value from error object
        if (computed.value !== undefined) {
          return String(computed.value);
        } else if (computed.message !== undefined) {
          return String(computed.message);
        } else if (computed.type !== undefined) {
          return `#${computed.type}`;
        } else {
          return '';
        }
      }
      // Return computed value as string
      return String(computed);
    }
    if (!raw) return '';
    if (!raw.startsWith('=')) return raw;
    return '';
  });
};

export const useCellRawValue = (cellId) => {
  return useCellStore((state) => state.cellValues[cellId] ?? '');
};

