export type NotebookCell = {
  id: string;
  type: 'code' | 'markdown';
  content: string;
  index: number;
}