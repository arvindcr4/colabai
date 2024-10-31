interface CreateOperation {
    type: 'create';
    cellType: 'markdown' | 'code';
    position: 'top' | 'bottom' | `after:${string}` | `before:${string}`;
    contentArray: string[];
    content: string;
}

interface EditOperation {
    type: 'edit';
    cellId: string;
    contentArray: string[];
    content: string;
}

interface DeleteOperation {
    type: 'delete';
    cellId: string;
}

type Operation = CreateOperation | EditOperation | DeleteOperation;

export function parseContent(content: string) {

    const operations: Operation[] = [];
    const lines = content.split(/\r?\n/).filter(line => line.trim());

    let currentOperation: Operation | null = null;
    let currentContent = [];

    // Regular expressions for parsing operations
    const createRegex = /@CREATE\[type=(markdown|code),\s*position=(top|bottom|after:(cell-[a-zA-Z0-9]+)|before:(cell-[a-zA-Z0-9]+))\]/;
    const editRegex = /@EDIT\[(cell-[a-zA-Z0-9]+)\]/;
    const deleteRegex = /@DELETE\[(cell-[a-zA-Z0-9]+)\]/;
    const endRegex = /@END/;

    lines.forEach(line => {
        // Check for new operation start
        const createMatch = line.match(createRegex);
        const editMatch = line.match(editRegex);
        const deleteMatch = line.match(deleteRegex);

        if (createMatch) {
            if (currentOperation) {
                finalizeCurrent();
            }
            currentOperation = {
                type: 'create',
                cellType: createMatch[1],
                position: createMatch[2],
                contentArray: [],
                content: ''
            } as CreateOperation;

        } else if (editMatch) {
            if (currentOperation) {
                finalizeCurrent();
            }
            currentOperation = {
                type: 'edit',
                cellId: editMatch[1],
                contentArray: [],
                content: ''
            } as EditOperation;

        } else if (deleteMatch) {
            operations.push({
                type: 'delete',
                cellId: deleteMatch[1]
            } as DeleteOperation);
        } else if (line.match(endRegex)) {
            if (currentOperation) {
                finalizeCurrent();
            }
        } else if (currentOperation) {
            if (currentOperation.type !== 'delete') {
                currentOperation.contentArray.push(line);
            }
        }
    });

    // Helper function to finalize current operation
    function finalizeCurrent() {
        if (currentOperation === null || currentOperation.type === 'delete')
            return;

        if (currentOperation.contentArray.length > 0) {
            currentOperation.content = currentOperation.contentArray.join('\n');
            operations.push(currentOperation);
        }
        currentOperation = null;
    }

    // Handle any remaining operation
    if (currentOperation) {
        finalizeCurrent();
    }

    console.log('Parsed operations:', operations);
    return operations;
}

// Example usage:
/*
const testContent = `
@CREATE[type=markdown, position=top]
# Data Analysis Project
This is a new project
@END

@CREATE[type=code, position=after:123]
import pandas as pd
import numpy as np
@END

@DELETE[456]

@MOVE[789, position=after:123]

@EDIT[012]
def process_data():
    return "processed"
@END
`;

const operations = parseContent(testContent);
*/