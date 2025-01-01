import React from 'react';
import { useAction } from './ActionContext';
import { Position, TextAction } from './types';

interface ActionSuggestionsProps {
  position: Position;
  selectedIndex: number;
  onSelect: (action: TextAction) => void;
}

export function ActionSuggestions({ position, selectedIndex, onSelect }: ActionSuggestionsProps) {
  const { filteredActions } = useAction();

  return (
    <div
      className="absolute z-10 w-64 max-h-48 overflow-y-auto bg-gray-800 border border-gray-800 rounded-lg shadow-lg"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`
      }}
      role="listbox"
      aria-label="Action suggestions"
    >
      {filteredActions.map((action, index) => (
        <div
          key={action.id}
          className={`p-2 cursor-pointer hover:bg-gray-700 ${index === selectedIndex ? 'bg-gray-800 text-white' : ''
            }`}
          onClick={() => onSelect(action)}
          role="option"
          aria-selected={index === selectedIndex}
        >
          <div className="font-medium">{action.label}</div>
        </div>
      ))}
    </div>
  );
}