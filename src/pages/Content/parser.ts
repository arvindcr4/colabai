export interface CreateOperation {
    type: 'create';
    cellType: 'markdown' | 'code';
    cellId?: string;
    position: 'top' | 'bottom' | `after:${string}` | `before:${string}`;
    contentArray: string[];
    content: string;
}

export interface EditOperation {
    type: 'edit';
    cellId: string;
    contentArray: string[];
    content: string;
}

export interface DeleteOperation {
    type: 'delete';
    cellId: string;
}

export type Operation = CreateOperation | EditOperation | DeleteOperation;

interface ParsedContent {
    beforeText: string;
    operations: Operation[];
    afterText: string;
}

// Track ongoing operations across streaming updates
interface StreamingState {
    buffer: string;
    textContent: string;
    appliedOperations: Set<string>;
    currentOperations: Map<string, Partial<Operation>>;
    isCodeBlock: boolean;
    fullResponse: string;
}

const streamingState: StreamingState = {
    buffer: '',
    textContent: '',
    fullResponse: '',
    appliedOperations: new Set(),
    currentOperations: new Map(),
    isCodeBlock: false
};

export function initializeStreamingState() {
    // Reset streaming state for new generation
    streamingState.buffer = '';
    streamingState.textContent = '';
    streamingState.fullResponse = '';
    streamingState.appliedOperations.clear();
    streamingState.currentOperations.clear();
    streamingState.isCodeBlock = false;
}

export function handleStreamingContent(newContent: string, done: boolean, applyOperation: (operation: Operation) => string | null,
    setMessageText: (text: React.SetStateAction<string>) => void, handleCodeBlock: (isCode: boolean) => void) {
    // Append new content to buffer
    streamingState.buffer += newContent;
    streamingState.fullResponse += newContent;

    // Process complete lines
    const lines = streamingState.buffer.split(/\r?\n/);
    streamingState.buffer = lines.pop() || ''; // Keep incomplete line in buffer

    // Collect text before and after code block
    if (!streamingState.isCodeBlock) {
        streamingState.textContent += newContent;
        setMessageText(streamingState.textContent);
    }

    processStreamingLines(lines, applyOperation, setMessageText, handleCodeBlock);

    if (done) {
        console.log(streamingState.fullResponse);
    }
}

// function processStreamingLines(lines: string[], applyOperation: (operation: Operation) => string | null,
//     setMessageText: (text: React.SetStateAction<string>) => void, handleCodeBlock: (isCode: boolean) => void) {
//     const createRegex = /@CREATE\[type=(markdown|code),\s*position=(top|bottom|after:(cell-[^\]]+)|before:(cell-[^\]]+))\]/;
//     const editRegex = /@EDIT\[(cell-[^\]]+)\]/;
//     const deleteRegex = /@DELETE\[(cell-[^\]]+)\]/;
//     const endRegex = /@END/;
//     const startCodeRegex = /@START_CODE/;
//     const endCodeRegex = /@END_CODE/;

//     for (const line of lines) {
//         try {
//             // Handle code block markers
//             if (line.match(startCodeRegex)) {
//                 streamingState.isCodeBlock = true;
//                 setMessageText(streamingState.textContent);
//                 handleCodeBlock(true);
//                 continue;  // Use continue instead of return
//             }
//             if (line.match(endCodeRegex)) {
//                 streamingState.isCodeBlock = false;
//                 handleCodeBlock(false);
//                 continue;  // Use continue instead of return
//             }

//             // Process operations
//             const createMatch = line.match(createRegex);
//             const editMatch = line.match(editRegex);
//             const deleteMatch = line.match(deleteRegex);

//             if (createMatch) {
//                 const operationId = `create-${Date.now()}-${Math.random()}`;
//                 const operation = {
//                     type: 'create',
//                     cellType: createMatch[1] as 'markdown' | 'code',
//                     cellId: '',
//                     position: createMatch[2] as "top" | "bottom" | `after:${string}` | `before:${string}`,
//                     contentArray: [],
//                     content: ''
//                 }

//                 // Check if any of the operations had the same position
//                 const samePositionOperations = Array.from(streamingState.currentOperations.values())
//                     .filter(op => op.type === 'create' && op.position === operation.position && op.position.startsWith('after:'));

//                 if (samePositionOperations.length > 0) {
//                     const lastOperation = samePositionOperations[samePositionOperations.length - 1];
//                     operation.position = `after:${lastOperation.cellId}`;
//                 }

//                 const id = applyOperation(operation as CreateOperation);
//                 if (!id) {
//                     console.error('Failed to apply create operation:', operation);
//                     continue;  // Skip this operation but continue processing
//                 }

//                 operation.cellId = id;
//                 streamingState.currentOperations.set(operationId, operation as CreateOperation);

//             } else if (editMatch) {
//                 const cellId = editMatch[1];
//                 const operation = {
//                     type: 'edit',
//                     cellId,
//                     contentArray: [],
//                     content: ''
//                 }

//                 streamingState.currentOperations.set(cellId, operation as EditOperation);
//                 const result = applyOperation(operation as EditOperation);
//                 if (!result) {
//                     console.error('Failed to apply edit operation:', operation);
//                     continue;
//                 }

//             } else if (deleteMatch) {
//                 const cellId = deleteMatch[1];
//                 if (!streamingState.appliedOperations.has(cellId)) {
//                     const result = applyOperation({
//                         type: 'delete',
//                         cellId
//                     });
//                     if (result) {
//                         streamingState.appliedOperations.add(cellId);
//                     } else {
//                         console.error('Failed to apply delete operation for cell:', cellId);
//                     }
//                 }

//             } else if (line.match(endRegex)) {
//                 // Finalize and verify current operations
//                 for (const [id, operation] of streamingState.currentOperations.entries()) {
//                     if (!streamingState.appliedOperations.has(id) &&
//                         'contentArray' in operation &&
//                         operation.contentArray &&
//                         operation.contentArray.length > 0) {

//                         const finalOperation = {
//                             ...operation,
//                             content: operation.contentArray.join('\n')
//                         };

//                         const result = applyOperation(finalOperation as Operation);
//                         if (result) {
//                             streamingState.appliedOperations.add(id);
//                         } else {
//                             console.error('Failed to apply final operation:', finalOperation);
//                         }
//                     }
//                 }
//                 streamingState.currentOperations.clear();

//             } else {
//                 // Add content to current operations
//                 for (const operation of streamingState.currentOperations.values()) {
//                     if (operation.type !== 'delete' && 'contentArray' in operation && operation.contentArray) {
//                         operation.contentArray.push(line);
//                         operation.content = operation.contentArray.join('\n');

//                         const result = applyOperation({
//                             type: 'edit',
//                             cellId: operation.cellId,
//                             contentArray: operation.contentArray,
//                             content: operation.content
//                         } as EditOperation);

//                         if (!result) {
//                             console.error('Failed to apply content update:', operation);
//                         }
//                     }
//                 }
//             }
//         } catch (error) {
//             console.error('Error processing line:', line, error);
//             // Continue processing remaining lines
//         }
//     }
// }

function processStreamingLines(lines: string[], applyOperation: (operation: Operation) => string | null,
    setMessageText: (text: React.SetStateAction<string>) => void, handleCodeBlock: (isCode: boolean) => void) {
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
            setMessageText(streamingState.textContent);
            handleCodeBlock(true);
            return;
        }
        if (line.match(endCodeRegex)) {
            streamingState.isCodeBlock = false;
            handleCodeBlock(false);
            return;
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

            // Check if any of the operations had the same position (after a specific cell), this is to ensure the order of operations
            const samePositionOperations = Array.from(streamingState.currentOperations.values())
                .filter(op => op.type === 'create' && op.position === operation.position && op.position.startsWith('after:'));

            if (samePositionOperations.length > 0) {
                const lastOperation = samePositionOperations[samePositionOperations.length - 1];
                operation.position = `after:${lastOperation.cellId}`;
            }

            const id = applyOperation(operation as CreateOperation);
            if (!id) {
                console.log('Failed to apply operation:', operation);
                return;
            }

            operation.cellId = id;
            streamingState.currentOperations.set(operationId, operation as CreateOperation);

            console.log('Create operation:', operation);
        } else if (editMatch) {
            const cellId = editMatch[1];
            const operation = {
                type: 'edit',
                cellId,
                contentArray: [],
                content: ''
            }

            streamingState.currentOperations.set(cellId, operation as EditOperation);
            applyOperation(operation as EditOperation);

            console.log('Edit operation:', operation);
        } else if (deleteMatch) {
            const cellId = deleteMatch[1];
            if (!streamingState.appliedOperations.has(cellId)) {
                applyOperation({
                    type: 'delete',
                    cellId
                });
                streamingState.appliedOperations.add(cellId);
            }
            console.log('Delete operation:', cellId);
        } else if (line.match(endRegex)) {
            // Finalize current operation
            for (const [id, operation] of streamingState.currentOperations.entries()) {

                if (!streamingState.appliedOperations.has(id) && 'contentArray' in operation && operation.contentArray && operation.contentArray.length > 0) {
                    streamingState.appliedOperations.add(id);
                    console.log('Applied operation:', operation);
                }
            }
            streamingState.currentOperations.clear();
        } else {
            // Add content to current operations
            for (const operation of streamingState.currentOperations.values()) {
                if (operation.type !== 'delete' && 'contentArray' in operation && operation.contentArray) {
                    operation.contentArray?.push(line);
                    operation.content = operation.contentArray.join('\n');

                    applyOperation({
                        type: 'edit',
                        cellId: operation.cellId,
                        contentArray: operation.contentArray,
                        content: operation.content
                    } as EditOperation);
                }
            }
        }
    }
}

// export function parseContent(content: string): ParsedContent {
//     const operations: Operation[] = [];
//     const beforeTextLines: string[] = [];
//     const afterTextLines: string[] = [];
//     const lines = content.split(/\r?\n/);

//     let currentOperation: Operation | null = null;
//     let currentContent = [];
//     let inCodeBlock = false;
//     let afterCodeBlock = false;

//     // Regular expressions for parsing operations
//     const createRegex = /@CREATE\[type=(markdown|code),\s*position=(top|bottom|after:(cell-[a-zA-Z0-9]+)|before:(cell-[a-zA-Z0-9]+))\]/;
//     const editRegex = /@EDIT\[(cell-[a-zA-Z0-9]+)\]/;
//     const deleteRegex = /@DELETE\[(cell-[a-zA-Z0-9]+)\]/;
//     const endRegex = /@END/;
//     const startCodeRegex = /@START_CODE/;
//     const endCodeRegex = /@END_CODE/;

//     lines.forEach(line => {
//         if (line.match(startCodeRegex)) {
//             inCodeBlock = true;
//             return;
//         }

//         if (line.match(endCodeRegex)) {
//             inCodeBlock = false;
//             afterCodeBlock = true;
//             return;
//         }

//         if (!inCodeBlock && !afterCodeBlock) {
//             beforeTextLines.push(line);
//             return;
//         }

//         if (afterCodeBlock) {
//             afterTextLines.push(line);
//             return;
//         }

//         // Check for new operation start
//         const createMatch = line.match(createRegex);
//         const editMatch = line.match(editRegex);
//         const deleteMatch = line.match(deleteRegex);

//         if (createMatch) {
//             if (currentOperation) {
//                 finalizeCurrent();
//             }
//             currentOperation = {
//                 type: 'create',
//                 cellType: createMatch[1],
//                 position: createMatch[2],
//                 contentArray: [],
//                 content: ''
//             } as CreateOperation;

//         } else if (editMatch) {
//             if (currentOperation) {
//                 finalizeCurrent();
//             }
//             currentOperation = {
//                 type: 'edit',
//                 cellId: editMatch[1],
//                 contentArray: [],
//                 content: ''
//             } as EditOperation;

//         } else if (deleteMatch) {
//             operations.push({
//                 type: 'delete',
//                 cellId: deleteMatch[1]
//             } as DeleteOperation);
//         } else if (line.match(endRegex)) {
//             if (currentOperation) {
//                 finalizeCurrent();
//             }
//         } else if (currentOperation) {
//             if (currentOperation.type !== 'delete') {
//                 currentOperation.contentArray.push(line);
//             }
//         }
//     });

//     // Helper function to finalize current operation
//     function finalizeCurrent() {
//         if (currentOperation === null || currentOperation.type === 'delete')
//             return;

//         if (currentOperation.contentArray.length > 0) {
//             currentOperation.content = currentOperation.contentArray.join('\n');
//             operations.push(currentOperation);
//         }
//         currentOperation = null;
//     }

//     // Handle any remaining operation
//     if (currentOperation) {
//         finalizeCurrent();
//     }

//     return {
//         beforeText: beforeTextLines.join('\n').trim(),
//         operations,
//         afterText: afterTextLines.join('\n').trim()
//     };
// }

// Example usage:
/*
const testContent = `
Some text before explaining the operations
@START_CODE
@CREATE[type=markdown, position=top]
# Data Analysis Project
This is a new project
@END

@CREATE[type=code, position=after:123]
import pandas as pd
import numpy as np
@END

@DELETE[456]

@EDIT[012]
def process_data():
    return "processed"
@END
@END_CODE
Some more text
`;

const parsedContent = parseContent(testContent);
console.log(parsedContent);
*/