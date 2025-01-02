import { parseLines } from '../../Background/Parsing/parser';
import { NotebookCell } from '../../../utils/types';
import { deepCopyStreamingState } from '../../../utils/deep-copy';
import { doneGenerating, sendTextContent } from '../content-messager';
import { Operation, Pending } from '../../../utils/operations';

const streamingState: StreamingState = {
  buffer: '',
  textContent: '',
  fullResponse: '',
  appliedOperations: new Map(),
  currentOperations: new Map(),
  isCodeBlock: false,
  originalContent: []
};

export function resetStreamingState(content: NotebookCell[]) {
  streamingState.buffer = '';
  streamingState.textContent = '';
  streamingState.fullResponse = '';
  streamingState.appliedOperations = new Map();
  streamingState.currentOperations = new Map();
  streamingState.isCodeBlock = false;
  streamingState.originalContent = content;
}

export async function updateStreamingContent (newContent: string, done: boolean) {

  streamingState.buffer = streamingState.buffer + newContent;
  streamingState.fullResponse = streamingState.fullResponse + newContent;

  // Process complete lines
  const lines = streamingState.buffer.split(/\r?\n/);
  streamingState.buffer = lines.pop() || '';

  if (!streamingState.isCodeBlock) {
    const newTextContent = streamingState.textContent + newContent;
    streamingState.textContent = newTextContent;
    //setMessageText(newTextContent);
    sendTextContent(newTextContent);
  }

  await parseLines(streamingState, lines);

  if (done) {
    doneGenerating(streamingState.appliedOperations);
  }

  return streamingState;
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
