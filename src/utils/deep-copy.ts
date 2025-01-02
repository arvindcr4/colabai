import { NotebookCell } from './types';
import { Operation, Pending, CreateOperation, DeleteOperation, DiffOperation, EditOperation } from './operations';
import { StreamingState } from '../pages/Background/Parsing/streaming-state';

/**
 * Creates a deep copy of a NotebookCell object
 */
export function deepCopyNotebookCell(cell: NotebookCell): NotebookCell {
    return {
        id: cell.id,
        type: cell.type,
        content: cell.content,
        index: cell.index
    };
}

/**
 * Creates a deep copy of an Operation object
 */
export function deepCopyOperation(operation: Operation): Operation {
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
export function deepCopyPendingOperation<T extends Operation>(pending: Pending<T>): Pending<T> {
    return {
        ...deepCopyOperation(pending),
        pending: pending.pending
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