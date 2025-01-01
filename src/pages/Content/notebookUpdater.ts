import { Operation, Pending } from './parser';
import { NotebookCell } from '../../utils/types';
import { diffLines } from 'diff';

export function applyOperation(operation: Operation): string | null {
    if (operation.type === 'create') {
        return insertCell(operation.content, operation.cellType, operation.position);
    } else if (operation.type === 'edit') {
        return updateCell(operation.cellId, operation.originalContent, operation.content);
    } else if (operation.type === 'delete') {
        return deleteCell(operation.cellId, operation.originalContent);
    } else if (operation.type === 'diff') {
        return diffCell(operation.cellId, operation.originalContent, operation.content);
    }
    return null;
}

export function insertCell(content: string, type: string, position: string): string | null {
    const atIndex = getCellIndexFromRelativePosition(position);
    if (atIndex === -1) {
        console.error('Invalid position');
        return null;
    }

    const notebook = document.querySelector('colab-shaded-scroller');
    if (!notebook) {
        console.error('Notebook element not found');
        return null;
    }

    const lastCell = notebook.querySelector(`.notebook-cell-list > :nth-child(${atIndex})`);
    if (atIndex !== 0 && !lastCell) {
        console.error('Cell not found');
        return null;
    }

    const addButtonGroup = atIndex === 0 ? notebook.querySelector('.add-cell') : lastCell?.querySelector('.add-cell');
    if (!addButtonGroup) {
        console.error('Add button group not found');
        return null;
    }

    var event = new MouseEvent('mouseenter', {
        'view': window,
        'bubbles': true,
        'cancelable': true
    });

    addButtonGroup.dispatchEvent(event); // Hover over the add cell button to make the buttons visible

    const addButton = addButtonGroup.querySelector(type === 'code' ? '.add-code' : '.add-text') as HTMLElement;
    addButton.click();

    // get the newly created cell
    const newCell = notebook.querySelector('.notebook-cell-list > :nth-child(' + (atIndex + 1) + ')');
    if (!newCell) {
        console.error('New cell not found');
        return null;
    }

    const id = newCell.getAttribute('id');

    if (content === '') {
        return id;
    }

    // Use a custom event to pass data to the page context
    setTimeout(() => {

        newCell.setAttribute('data-operation', 'insert');

        const customEvent = new CustomEvent('setMonacoValue', {
            detail: { id: id, content: content, type: type }
        });
        document.dispatchEvent(customEvent);

        newCell.classList.remove('edit');

    }, 500);  // Increased timeout to allow for cell creation

    return id;
}

export function updateCell(id: string, originalContent: string, newContent: string) {
    const cell = document.getElementById(id);
    if (!cell) return null;

    const customEvent = new CustomEvent('setMonacoValue', {
        detail: { id, content: newContent }
    });
    document.dispatchEvent(customEvent);

    return id;
}

export function deleteCell(id: string, originalContent: string) {
    const cell = document.getElementById(id);
    if (!cell) return null;

    const mainContent = cell.querySelector('.main-content') as HTMLElement;
    if(mainContent)
        mainContent.style.opacity = '0.5';
    
    // injectCellActions(
    //     id, 
    //     true,
    //     () => acceptChange(id),
    //     () => rejectChange(id)
    // );

    return id;
}

function diffCell(id: string, originalContent: string, newContent: string) {
    const cell = document.getElementById(id);
    if (!cell || cell.classList.contains('text')) return null;

    const diff = diffLines(originalContent, newContent);

    const customEvent = new CustomEvent('diffMonacoValue', {
        detail: { id, diff }
    });
    document.dispatchEvent(customEvent);

    cell.setAttribute('data-diff', 'true');
    
    // injectCellActions(
    //     id, 
    //     true,
    //     () => acceptChange(id),
    //     () => rejectChange(id)
    // );

    return id;
}


export function acceptChange(change: Operation): () => void {

    //injectCellActions(change.cellId, false, () => {}, () => {});

    if (change.type === 'delete') {
        const customEvent = new CustomEvent('deleteCell', { 
            detail: { id: change.cellId } 
        });
        return () => document.dispatchEvent(customEvent);
    } else {
        const customEvent = new CustomEvent('setMonacoValue', {
            detail: { id: change.cellId, content: change.content }
        });

        return () => {
            stopDiff(change.cellId);
            document.dispatchEvent(customEvent);
        }
    }

    // if (pendingChanges.size === 0) {
    //     const customEvent = new CustomEvent('diff_complete', { detail: { id: 'diff_complete' } });
    //     document.dispatchEvent(customEvent);
    // }
}

export function rejectChange(change: Operation): () => void {

    //injectCellActions(change.cellId, false, () => {}, () => {});

    if (change.type === 'create') {
        const customEvent = new CustomEvent('deleteCell', { 
            detail: { id: change.cellId } 
        });

        return () => {
            stopDiff(change.cellId);
            document.dispatchEvent(customEvent);
        }
    } else if (change.type === 'edit' && change.originalContent) {
        const customEvent = new CustomEvent('setMonacoValue', {
            detail: { id: change.cellId, content: change.originalContent }
        });

        return () => {
            stopDiff(change.cellId);
            document.dispatchEvent(customEvent);
        }
    } else if (change.type === 'delete') {
        return () => {
            const cell = document.getElementById(change.cellId);
            if (cell) {
                const mainContent = cell.querySelector('.main-content') as HTMLElement;
                if(mainContent)
                    mainContent.style.opacity = '1';
            }
        };
    }

    return () => {};

    // if (pendingChanges.size === 0) {
    //     const customEvent = new CustomEvent('diff_complete', { detail: { id: 'diff_complete' } });
    //     document.dispatchEvent(customEvent);
    // }
}

const stopDiff = (cellId: string) => {
    const cell = document.getElementById(cellId);
    if (cell) {
        cell.setAttribute('data-diff', 'false');
    }
}

export async function requestContent(): Promise<NotebookCell[]> {
    return new Promise((resolve) => {
        function handleContentEvent(event: CustomEvent) {
            document.removeEventListener('contentValue', handleContentEvent as EventListener);
            resolve(event.detail.content);
        }

        document.addEventListener('contentValue', handleContentEvent as EventListener);

        const customEvent = new CustomEvent('getContent');
        document.dispatchEvent(customEvent);
    });
}

export async function getCellContent(cellId: string): Promise<string> {
    return new Promise((resolve) => {
        function handleContentEvent(event: CustomEvent) {
            document.removeEventListener('contentValue', handleContentEvent as EventListener);
            resolve(event.detail.content);
        }

        document.addEventListener('contentValue', handleContentEvent as EventListener);

        const customEvent = new CustomEvent('getMonacoValue', { detail: { id: cellId } });
        document.dispatchEvent(customEvent);
    });
}

function getCellIndexFromRelativePosition(position: string): number {
    const notebook = document.querySelector('colab-shaded-scroller');
    if (!notebook) {
        console.error('Notebook element not found');
        return -1;
    }
    const cells = notebook.querySelectorAll('.cell');

    if (position === 'top') {
        return 0;
    } else if (position === 'bottom') {
        return cells.length;
    } else if (position.startsWith('after:')) {
        const id = position.split(':')[1];
        let index = Array.from(cells).findIndex(cell => cell.getAttribute('id') === id);
        
        return index + 1;
    } else if (position.startsWith('before:')) {
        const id = position.split(':')[1];
        const index = Array.from(cells).findIndex(cell => cell.getAttribute('id') === id);
        return index;
    } else {
        return -1;
    }
}