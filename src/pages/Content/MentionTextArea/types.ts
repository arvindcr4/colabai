export interface TextAction {
  id: string;
  label: string;
  action: () => string | null;
}

export interface ActionData {
  id: string;
  label: string;
}

export interface Position {
  top: number;
  left: number;
}