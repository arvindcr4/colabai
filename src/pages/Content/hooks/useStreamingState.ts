import { useState, useCallback } from 'react';
import { parseLines, Operation, Pending } from '../parser';
import { NotebookCell } from '../../../utils/types';
import { deepCopyStreamingState } from '../../../utils/deep-copy';
import { acceptChange, rejectChange } from '../notebookUpdater';

export function useStreamingState() {
    const [streamingState, setStreamingState] = useState<StreamingState>({
        buffer: '',
        textContent: '',
        fullResponse: '',
        appliedOperations: new Map(),
        currentOperations: new Map(),
        isCodeBlock: false,
        originalContent: []
    });
  
    const updateStreamingContent = useCallback((
      newContent: string, 
      done: boolean,
      setMessageText: (text: React.SetStateAction<string>) => void
    ) => {
      setStreamingState(prevState => {
        // If nothing changed or content is already in buffer, return same state
        if (!newContent || prevState.fullResponse.endsWith(newContent)) {
          return prevState;
        }

        const nextState = deepCopyStreamingState(prevState);
        nextState.buffer = prevState.buffer + newContent;
        nextState.fullResponse = prevState.fullResponse + newContent;

        // Process complete lines
        const lines = nextState.buffer.split(/\r?\n/);
        nextState.buffer = lines.pop() || '';
  
        if (!nextState.isCodeBlock) {
          const newTextContent = prevState.textContent + newContent;
          nextState.textContent = newTextContent;
          setMessageText(newTextContent);
        }
  
        // Only parse and create new Maps if we have lines to process
        if (lines.length > 0) {
          const processedState = parseLines(nextState, lines);
          return processedState;
        }
  
        return nextState;
      });
    }, []); // No dependencies needed since we use functional updates

    const resetStreamingState = useCallback((content: NotebookCell[]) => {
        setStreamingState({
            buffer: '',
            textContent: '',
            fullResponse: '',
            appliedOperations: new Map(),
            currentOperations: new Map(),
            isCodeBlock: false,
            originalContent: content
        });
    }, []);
    
    return {streamingState, updateStreamingContent, resetStreamingState};
}

// Track ongoing operations across streaming updates
export interface StreamingState {
    buffer: string;
    textContent: string;
    appliedOperations: Map<string, Pending<Operation>>;
    currentOperations: Map<string, Operation>;
    isCodeBlock: boolean;
    fullResponse: string;

    originalContent: NotebookCell[];
}
