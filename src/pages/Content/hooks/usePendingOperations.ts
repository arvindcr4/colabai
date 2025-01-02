import { useEffect, useState, useCallback } from 'react';
import { Operation, Pending } from '../../../utils/operations';
import { acceptChange, rejectChange } from '../notebookUpdater';
import { deepCopyPendingOperation } from '../../../utils/deep-copy';

export const usePendingOperations = (onDoneDiff: () => void) => {
    
    const [pendingOperations, setPendingOperations] = useState<Map<string, Pending<Operation>>>(new Map());
    
    const anyPendingOperations = () => {
        return pendingOperations.size > 0;
    };
  
    function acceptAllOperations() {
        pendingOperations.forEach((operation, cellId) => {
            if (operation.pending) {
                acceptChange(operation);
                setPendingOperations((prev) => {
                    const newMap = new Map(
                        Array.from(prev.entries()).map(
                            ([key, value]) => [key, deepCopyPendingOperation(value)]
                        )
                    );
                    newMap.delete(cellId);
                    return newMap;
                });
            }
        });

        onDoneDiff();
    }
    
    function rejectAllOperations() {
        pendingOperations.forEach((operation, cellId) => {
            if (operation.pending) {
                rejectChange(operation);
                setPendingOperations((prev) => {
                    const newMap = new Map(
                        Array.from(prev.entries()).map(
                            ([key, value]) => [key, deepCopyPendingOperation(value)]
                        )
                    );
                    newMap.delete(cellId);
                    return newMap;
                });
            }
        });

        onDoneDiff();
    }

    function acceptOperation(cellId: string) {
        const operation = pendingOperations.get(cellId);
        if (operation) {
            acceptChange(operation);
            setPendingOperations((prev) => {
                const newMap = new Map(
                    Array.from(prev.entries()).map(
                        ([key, value]) => [key, deepCopyPendingOperation(value)]
                    )
                );
                newMap.delete(cellId);
                return newMap;
            });
        }

        if (!anyPendingOperations()) {
            onDoneDiff();
        }
    }

    function rejectOperation(cellId: string) {
        const operation = pendingOperations.get(cellId);
        if (operation) {
            rejectChange(operation);
            setPendingOperations((prev) => {
                const newMap = new Map(
                    Array.from(prev.entries()).map(
                        ([key, value]) => [key, deepCopyPendingOperation(value)]
                    )
                );
                newMap.delete(cellId);
                return newMap;
            });
        }

        if (!anyPendingOperations()) {
            onDoneDiff();
        }
    }

    return { pendingOperations, setPendingOperations, anyPendingOperations, acceptOperation, rejectOperation, acceptAllOperations, rejectAllOperations };
};