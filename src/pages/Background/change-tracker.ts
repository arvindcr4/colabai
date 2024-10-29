// Structure to represent a notebook cell

interface NotebookCellConstructorParams {
    id: string;
    type: 'code' | 'text';
    content: string;
    index: number;
}

export class NotebookCell {
    id: string;
    type: 'code' | 'text';
    content: string;
    index: number;

    constructor({ id, type, content, index }: NotebookCellConstructorParams) {
        this.id = id;
        this.type = type;    // 'code' or 'markdown'
        this.content = content;
        this.index = index;
    }
}

interface CellChange {
    type: 'add' | 'remove' | 'modify' | 'move';
    cell?: NotebookCell;
    cellId?: string;
    position?: string;
    oldContent?: string;
    newContent?: string;
}

interface AddedCellChange extends CellChange {
    type: 'add';
    cell: NotebookCell;
    position: string;
}

interface RemovedCellChange extends CellChange {
    type: 'remove';
    cellId: string;
}

interface ModifiedCellChange extends CellChange {
    type: 'modify';
    cellId: string;
    oldContent: string;
    newContent: string;
}

interface MovedCellChange extends CellChange {
    type: 'move';
    cellId: string;
    position: string;
}

// Class to track and generate notebook changes
export class NotebookChangeTracker {
    lastState: Map<string, NotebookCell>;
    cellOrder: string[];

    constructor() {
        this.lastState = new Map();  // Map<cellId, NotebookCell>
        this.cellOrder = [];         // Array of cell IDs in order
    }

    // Update the tracker with current notebook state
    updateState(currentCells: NotebookCell[]): string {
        const newState: Map<string, NotebookCell> = new Map();
        const newOrder: string[] = [];
        const changes: CellChange[] = [];

        // Create new state map and order
        currentCells.forEach((cell, index) => {
            newState.set(cell.id, new NotebookCell({
                id: cell.id,
                type: cell.type,
                content: cell.content,
                index: index
            }));
            newOrder.push(cell.id);
        });

        // Generate changes
        changes.push(...this.detectAddedCells(newState));
        changes.push(...this.detectRemovedCells(newState));
        changes.push(...this.detectModifiedCells(newState));
        changes.push(...this.detectMovedCells(newOrder, newState));

        // Update state
        this.lastState = newState;
        this.cellOrder = newOrder;

        console.log('Changes:', changes);

        return this.formatChangesForAI(changes);
    }

    detectAddedCells(newState: Map<string, NotebookCell>): AddedCellChange[] {
        const changes: AddedCellChange[] = [];
        newState.forEach((cell, id) => {
            if (!this.lastState.has(id)) {
                changes.push({
                    type: 'add',
                    cell: cell,
                    position: this.determineRelativePosition(cell.index)
                });
            }
        });
        return changes;
    }

    detectRemovedCells(newState: Map<string, NotebookCell>): RemovedCellChange[] {
        const changes: RemovedCellChange[] = [];
        this.lastState.forEach((cell, id) => {
            if (!newState.has(id)) {
                changes.push({
                    type: 'remove',
                    cellId: id
                });
            }
        });
        return changes;
    }

    detectModifiedCells(newState: Map<string, NotebookCell>): ModifiedCellChange[] {
        const changes: ModifiedCellChange[] = [];
        newState.forEach((newCell, id) => {
            const oldCell = this.lastState.get(id);
            if (oldCell && oldCell.content !== newCell.content) {
                changes.push({
                    type: 'modify',
                    cellId: id,
                    oldContent: oldCell.content,
                    newContent: newCell.content
                });
            }
        });
        return changes;
    }

    detectMovedCells(newOrder: string[], newState: Map<string, NotebookCell>): MovedCellChange[] {
        const changes: MovedCellChange[] = [];
        const oldPositions: Map<string, number> = new Map();

        // Create map of old positions
        this.cellOrder.forEach((id, index) => {
            oldPositions.set(id, index);
        });

        // Detect moves
        newOrder.forEach((id, newIndex) => {
            const oldIndex = oldPositions.get(id);
            if (oldIndex !== undefined && oldIndex !== newIndex) {
                changes.push({
                    type: 'move',
                    cellId: id,
                    position: this.determineRelativePosition(newIndex)
                });
            }
        });
        return changes;
    }

    determineRelativePosition(index: number): string {
        if (index === 0) return 'top';
        if (index === this.cellOrder.length) return 'bottom';

        const previousCellId = this.cellOrder[index - 1];
        return `after:${previousCellId}`;
    }

    formatChangesForAI(changes: CellChange[]): string {
        let changeLog = `@NOTEBOOK_CHANGES\n`;

        changes.forEach(change => {
            switch (change.type) {
                case 'add':
                    const addedChange = change as AddedCellChange;
                    changeLog += `@ADDED[id=${addedChange.cell.id}, type=${addedChange.cell.type}, position=${addedChange.position}]\n`;
                    changeLog += addedChange.cell.content + '\n';
                    changeLog += '@END\n\n';
                    break;

                case 'remove':
                    const removedChange = change as RemovedCellChange;
                    changeLog += `@REMOVED[${removedChange.cellId}]\n\n`;
                    break;

                case 'modify':
                    const modifiedChange = change as ModifiedCellChange;
                    changeLog += `@MODIFIED[${modifiedChange.cellId}]\n`;
                    changeLog += '--- Previous content ---\n';
                    changeLog += modifiedChange.oldContent + '\n';
                    changeLog += '--- New content ---\n';
                    changeLog += modifiedChange.newContent + '\n';
                    changeLog += '@END\n\n';
                    break;

                case 'move':
                    const moveChange = change as MovedCellChange;
                    changeLog += `@MOVED[${moveChange.cellId}, position=${moveChange.position}]\n\n`;
                    break;
            }
        });

        changeLog += '@END_CHANGES';
        console.log('Change log:', changeLog);
        return changeLog;
    }
}