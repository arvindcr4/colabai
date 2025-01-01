import { useEffect, useState, useCallback } from 'react';
import { Operation, Pending } from '../parser';
import { acceptChange, rejectChange } from '../notebookUpdater';

export const usePendingOperations = () => {
    
    const [pendingOperations, setPendingOperations] = useState<Map<string, Pending<Operation>>>(new Map());
    
    const anyPendingChanges = () => {
        return pendingOperations.size > 0;
    };
  
    function acceptAllChanges() {
        pendingOperations.forEach((operation, cellId) => {
            if (operation.pending) {
                operation.accept?.();
                setPendingOperations((prev) => {
                    const newMap = new Map(prev);
                    newMap.delete(cellId);
                    return newMap;
                });
            }
        });
    }
    
    function rejectAllChanges() {
        pendingOperations.forEach((operation, cellId) => {
            if (operation.pending) {
                operation.reject?.();
                setPendingOperations((prev) => {
                    const newMap = new Map(prev);
                    newMap.delete(cellId);
                    return newMap;
                });
            }
        });
    }

    return { pendingOperations, setPendingOperations, anyPendingChanges, acceptAllChanges, rejectAllChanges };
};