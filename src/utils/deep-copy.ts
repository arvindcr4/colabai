import { NotebookCell } from './types';
import { CreateOperation, DeleteOperation, DiffOperation, EditOperation } from '../pages/Content/parser';
import { Operation, Pending } from '../pages/Content/parser';
import { StreamingState } from '../pages/Content/hooks/useStreamingState';

/**
 * Creates a deep copy of a NotebookCell object
 */
function deepCopyNotebookCell(cell: NotebookCell): NotebookCell {
    return {
        id: cell.id,
        type: cell.type,
        content: cell.content
    };
}

/**
 * Creates a deep copy of an Operation object
 */
function deepCopyOperation(operation: Operation): Operation {
    const baseCopy = { ...operation };
    
    switch (operation.type) {
        case 'create':
            return {
                ...baseCopy,
                contentArray: [...operation.contentArray],
                content: operation.content,
                cellType: operation.cellType,
                cellId: operation.cellId,
                position: operation.position
            } as CreateOperation;
            
        case 'edit':
            return {
                ...baseCopy,
                contentArray: [...operation.contentArray],
                content: operation.content,
                originalContent: operation.originalContent
            } as EditOperation;
            
        case 'delete':
            return {
                ...baseCopy,
                originalContent: operation.originalContent
            } as DeleteOperation;
            
        case 'diff':
            return {
                ...baseCopy,
                originalContent: operation.originalContent,
                content: operation.content
            } as DiffOperation;
    }
}

/**
 * Creates a deep copy of a Pending<Operation> object
 */
function deepCopyPendingOperation<T extends Operation>(pending: Pending<T>): Pending<T> {
    return {
        ...deepCopyOperation(pending),
        pending: pending.pending,
        accept: pending.accept,
        reject: pending.reject
    } as Pending<T & Operation>;
}

/**
 * Creates a deep copy of a StreamingState object
 */
export function deepCopyStreamingState(state: StreamingState): StreamingState {
    return {
        buffer: state.buffer,
        textContent: state.textContent,
        appliedOperations: new Map(
            Array.from(state.appliedOperations.entries()).map(
                ([key, value]) => [key, deepCopyPendingOperation(value)]
            )
        ),
        currentOperations: new Map(
            Array.from(state.currentOperations.entries()).map(
                ([key, value]) => [key, deepCopyOperation(value)]
            )
        ),
        isCodeBlock: state.isCodeBlock,
        fullResponse: state.fullResponse,
        originalContent: state.originalContent.map(deepCopyNotebookCell)
    };
}