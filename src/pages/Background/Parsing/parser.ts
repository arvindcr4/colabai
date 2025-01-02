import { getCellContent, requestContent } from "../../Content/notebookUpdater";
import { NotebookCell } from "../../../utils/types";
import { StreamingState } from "./streaming-state";
import { sendOperation } from "../content-messager";
import { CreateOperation, DeleteOperation, EditOperation, DiffOperation, Operation, Pending } from "../../../utils/operations";

export async function parseLines(streamingState: StreamingState, lines: string[]): Promise<StreamingState> {

    const createRegex = /@CREATE\[type=(markdown|code),\s*position=(top|bottom|after:(cell-[^\]]+)|before:(cell-[^\]]+))\]/;
    const editRegex = /@EDIT\[(cell-[^\]]+)\]/;
    const deleteRegex = /@DELETE\[(cell-[^\]]+)\]/;
    const endRegex = /@END/;
    const startCodeRegex = /@START_CODE/;
    const endCodeRegex = /@END_CODE/;

    for (const line of lines) {
        // Handle code block markers
        if (line.match(startCodeRegex)) {
            streamingState.isCodeBlock = true;
            return streamingState;
        }
        if (line.match(endCodeRegex)) {
            streamingState.isCodeBlock = false;
            return streamingState;
        }

        // Process operations
        const createMatch = line.match(createRegex);
        const editMatch = line.match(editRegex);
        const deleteMatch = line.match(deleteRegex);

        if (createMatch) {
            const operationId = `create-${Date.now()}-${Math.random()}`;
            const operation = {
                type: 'create',
                cellType: createMatch[1] as 'markdown' | 'code',
                cellId: '',
                position: createMatch[2] as "top" | "bottom" | `after:${string}` | `before:${string}`,
                contentArray: [],
                content: ''
            }

            let id;

            // If the operation is after a specific cell, find the last operation that was created after that cell (this is needed to ensure that cells are inserted in the correct order)
            if(operation.position.startsWith('after:')) {
                let position = operation.position;

                // Find all previous operations that were created after this same cell
                const previousOperations = Array.from(streamingState.appliedOperations.values())
                    .filter(op => 
                        op.type === 'create' && op.position === operation.position
                    );

                if (previousOperations.length > 0) {
                    // Get the last operation in the chain
                    const lastOperation = previousOperations[previousOperations.length - 1];
                    position = `after:${lastOperation.cellId}`;
                }
                id = await sendOperation({ ...operation, position } as CreateOperation);
            } else {
                id = await sendOperation(operation as CreateOperation);
            }

            if (!id || id === '') {
                console.log('[Parser] Failed to apply operation:', operation);
                return streamingState;
            }

            operation.cellId = id;
            streamingState.currentOperations.set(operation.cellId, operation as CreateOperation);

            console.log('[Parser] Create operation:', operation);
        } else if (editMatch) {
            const cellId = editMatch[1];
            const operation = {
                type: 'edit',
                cellId,
                contentArray: [],
                content: '',
                originalContent: streamingState.originalContent.find(cell => cell.id === cellId)?.content || ''
            }

            streamingState.currentOperations.set(cellId, operation as EditOperation);
            await sendOperation(operation as EditOperation);

            console.log('[Parser] Edit operation:', operation);
        } else if (deleteMatch) {
            const cellId = deleteMatch[1];
            const originalContent = streamingState.originalContent.find(cell => cell.id === cellId)?.content || '';
            const operation: DeleteOperation = {
                type: 'delete',
                cellId,
                originalContent
            };

            await sendOperation(operation);

            streamingState.appliedOperations.set(cellId, {
                ...operation,
                pending: true
            });
            
            console.log('[Parser] Delete operation:', cellId);
        } else if (line.match(endRegex)) {
            // Finalize current operation
            for (const [id, operation] of streamingState.currentOperations.entries()) {

                if(operation.type === 'create' || operation.type === 'edit') {
                    console.log('[Parser] Applied operation:', operation);

                    const pendingOperation = {
                        ...operation,
                        pending: true,
                    };
                    streamingState.appliedOperations.set(operation.cellId, pendingOperation);
                    
                    await sendOperation({
                        type: 'diff',
                        cellId: operation.cellId,
                        originalContent: operation.type === 'edit' ? (operation as EditOperation).originalContent : '',
                        content: operation.content
                    } as DiffOperation);
                }
            }
            streamingState.currentOperations.clear();
        } else {
            // Add content to current operations
            for (const operation of streamingState.currentOperations.values()) {
                if (operation.type !== 'delete' && 'contentArray' in operation && operation.contentArray) {
                    operation.contentArray?.push(line);
                    operation.content = operation.contentArray.join('\n');

                    await sendOperation({
                        type: 'edit',
                        cellId: operation.cellId,
                        contentArray: operation.contentArray,
                        content: operation.content,
                        originalContent: operation.type === 'edit' ? (operation as EditOperation).originalContent : ''
                    } as EditOperation);
                }
            }
        }
    }

    return streamingState;
}

