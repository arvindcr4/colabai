import { useState, useCallback, useRef } from 'react';
import { useAction } from '../ActionContext';
import { Position, TextAction } from '../types';
import { getCaretPosition } from '../utils/domUtils';
import { useTextContent } from './useTextContent';

export function useActionSuggestions() {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionPosition, setSuggestionPosition] = useState<Position>({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const lastSelectionRange = useRef<Range | null>(null);
  const { actions, setFilteredActions } = useAction();
  const { getTextContent } = useTextContent();

  const handleActionSearch = useCallback((selection: Selection) => {
    if (!selection.anchorNode) return false;

    // Check if we're inside a action pill
    const isInsideActionPill = (selection.anchorNode as Element).closest?.('.action-pill') ||
                               (selection.anchorNode.parentElement?.closest?.('.action-pill'));
    if (isInsideActionPill) {
      setShowSuggestions(false);
      return false;
    }

    // Get text content and cursor position
    const { text, position } = getTextContent(selection.anchorNode, selection.anchorOffset);
    
    // Find the last @ symbol before the cursor
    const textBeforeCursor = text.slice(0, position);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const searchStr = textBeforeCursor.slice(lastAtIndex + 1).toLowerCase();
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      
      // Only show suggestions if there's no space after @
      if (!textAfterAt.includes(' ')) {
        const filtered = actions.filter((action: TextAction) => 
          action.label.toLowerCase().includes(searchStr)
        );
        
        setFilteredActions(filtered);
        
        if (filtered.length > 0) {
          const coords = getCaretPosition(selection);
          const editor = (selection.anchorNode as Element).closest?.('[contenteditable="true"]') || 
                        (selection.anchorNode.parentElement?.closest?.('[contenteditable="true"]'));
          
          if (editor) {
            //const editorRect = editor.getBoundingClientRect();
            setSuggestionPosition({
              top: coords.bottom,
              left: coords.left
            });
          } else {
            setSuggestionPosition({
              top: coords.bottom,
              left: coords.left
            });
          }
          setShowSuggestions(true);
          setSelectedIndex(0);
          return true;
        }
      }
    }
    
    setShowSuggestions(false);
    return false;
  }, [actions, setFilteredActions, getTextContent]);

  return {
    showSuggestions,
    setShowSuggestions,
    suggestionPosition,
    selectedIndex,
    setSelectedIndex,
    lastSelectionRange,
    handleActionSearch
  };
}