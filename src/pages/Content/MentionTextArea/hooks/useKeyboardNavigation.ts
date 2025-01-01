import React, { KeyboardEvent } from 'react';
import { TextAction } from '../types';

interface KeyboardNavigationProps {
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  selectedIndex: number;
  setSelectedIndex: (index: React.SetStateAction<number>) => void;
  filteredActions: TextAction[];
  insertAction: (action: TextAction) => void;
}

export function useKeyboardNavigation({
  showSuggestions,
  setShowSuggestions,
  selectedIndex,
  setSelectedIndex,
  filteredActions,
  insertAction
}: KeyboardNavigationProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (showSuggestions) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredActions.length);
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length);
          break;
        case 'Enter':
          event.preventDefault();
          if (filteredActions[selectedIndex]) {
            insertAction(filteredActions[selectedIndex]);
          }
          break;
        case 'Tab':
          event.preventDefault();
          if (filteredActions[selectedIndex]) {
            insertAction(filteredActions[selectedIndex]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          setShowSuggestions(false);
          break;
      }
    }
  };

  return handleKeyDown;
}