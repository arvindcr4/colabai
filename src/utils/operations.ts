
export interface CreateOperation {
    type: 'create';
    cellType: 'markdown' | 'code';
    cellId: string;
    position: 'top' | 'bottom' | `after:${string}` | `before:${string}`;
    contentArray: string[];
    content: string;
}

export interface EditOperation {
    type: 'edit';
    cellId: string;
    contentArray: string[];
    content: string;
    originalContent: string;
}

export interface DeleteOperation {
    type: 'delete';
    cellId: string;
    originalContent: string;
}

export interface DiffOperation {
    type: 'diff';
    cellId: string;
    originalContent: string;
    content: string;
}

export type Operation = CreateOperation | EditOperation | DeleteOperation | DiffOperation;

// Add a pending attribute to the operation type
export type Pending<T extends Operation> = T & { pending: boolean };