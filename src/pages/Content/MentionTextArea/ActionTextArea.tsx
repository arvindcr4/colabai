import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useAction } from './ActionContext';
import { ActionSuggestions } from './ActionSuggestions';
import { ActionData, TextAction } from './types';
import { insertActionAtCursor } from './utils/domUtils';
import { createActionNode, removeAction } from './utils/actionUtils';
import { useActionSuggestions } from './hooks/useActionSuggestions';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';

export interface ActionTextAreaRef {
  clear: () => void;
}

export const ActionTextArea = forwardRef<ActionTextAreaRef, { 
  onInput: (text: string) => void;
  onSubmit?: () => void;
}>(({ onInput, onSubmit }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const { filteredActions } = useAction();

  const {
    showSuggestions,
    setShowSuggestions,
    suggestionPosition,
    selectedIndex,
    setSelectedIndex,
    lastSelectionRange,
    handleActionSearch
  } = useActionSuggestions();

  const insertAction = useCallback((action: TextAction) => {
    if (!editorRef.current) return;

    const actionResult = action.action();

    if (!actionResult) return;

    const actionData: ActionData = {
      id: action.id + Date.now(),
      label: actionResult
    };

    const actionNode = createActionNode(actionData);
    insertActionAtCursor(actionNode, lastSelectionRange.current);
    setShowSuggestions(false);
    editorRef.current.focus();
  }, []);

  const handleKeyDown = useKeyboardNavigation({
    showSuggestions,
    setShowSuggestions,
    selectedIndex,
    setSelectedIndex,
    filteredActions,
    insertAction,
    onSubmit
  });

  const handleBackspace = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Backspace') {
      event.stopPropagation();
      const selection = window.getSelection();
      if (!selection || !selection.anchorNode) return;

      const actionElement = (selection.anchorNode as Element).closest?.('.action-pill') ||
        (selection.anchorNode.parentElement?.closest?.('.action-pill'));

      if (actionElement) {
        event.preventDefault();
        removeAction(actionElement as HTMLElement);
      }
    }
  }, []);

  const handleInput = useCallback(() => {
    requestAnimationFrame(() => {
      const selection = window.getSelection();
      if (!selection) return;

      lastSelectionRange.current = selection.getRangeAt(0);

      handleActionSearch(selection);
      onInput(editorRef.current?.textContent || '');
    });
  }, [handleActionSearch, onInput]);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      const observer = new MutationObserver(() => {
        if (!editor.textContent && !editor.querySelector('.action-pill')) {
          editor.textContent = '';
        }
      });

      observer.observe(editor, {
        childList: true,
        subtree: true,
        characterData: true
      });

      return () => observer.disconnect();
    }
  }, []);

  // useEffect(() => {
  //   function handleClickOutside(event: MouseEvent) {
  //     if (editorRef.current && !editorRef.current.contains(event.target as Node)) {
  //       setShowSuggestions(false);
  //     }
  //   }

  //   document.addEventListener('mousedown', handleClickOutside);
  //   return () => document.removeEventListener('mousedown', handleClickOutside);
  // }, [setShowSuggestions]);

  useImperativeHandle(ref, () => ({
    clear: () => {
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
        onInput('');
      }
    }
  }));

  return (
    <div className="relative w-full">
      <div
        ref={editorRef}
        className="ai-scrollbar w-full overflow-y-auto min-h-[2.5rem] max-h-24 bg-gray-800 text-gray-100 rounded-lg p-2 focus:outline-none ring-1 ring-gray-900 focus:ring-1 focus:ring-orange-600"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={(e) => {
          e.stopPropagation();
          handleKeyDown(e);
          handleBackspace(e);
        }}
        role="textbox"
        aria-label="Colab AI assistant text area"
        data-placeholder="Ask me anything..."
      />

      {showSuggestions && (
        <ActionSuggestions
          position={suggestionPosition}
          selectedIndex={selectedIndex}
          onSelect={insertAction}
        />
      )}
    </div>
  );
});