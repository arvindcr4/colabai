import React, { createContext, useContext, useState } from 'react';
import { TextAction } from './types';

interface ActionContextType {
  actions: TextAction[];
  filteredActions: TextAction[];
  setFilteredActions: (actions: TextAction[]) => void;
}

const ActionContext = createContext<ActionContextType | undefined>(undefined);

export function ActionProvider({ actions, children }: { actions: TextAction[], children: React.ReactNode }) {
  const [filteredActions, setFilteredActions] = useState<TextAction[]>([]);

  return (
    <ActionContext.Provider value={{ actions, filteredActions, setFilteredActions }}>
      {children}
    </ActionContext.Provider>
  );
}

export function useAction() {
  const context = useContext(ActionContext);
  if (!context) {
    throw new Error('useAction must be used within a ActionProvider');
  }
  return context;
}