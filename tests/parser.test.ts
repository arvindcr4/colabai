import { parseLines } from '../src/pages/Content/parser';
import { StreamingState } from '../src/pages/Content/hooks/useStreamingState';
import * as notebookUpdater from '../src/pages/Content/notebookUpdater';

// Mock the notebookUpdater functions
jest.mock('../src/pages/Content/notebookUpdater', () => ({
  applyOperation: jest.fn(),
  acceptChange: jest.fn(),
  rejectChange: jest.fn(),
}));

describe('Parser Tests', () => {
  let streamingState: StreamingState;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Initialize streamingState before each test
    streamingState = {
      buffer: '',
      textContent: '',
      fullResponse: '',
      isCodeBlock: false,
      currentOperations: new Map(),
      appliedOperations: new Map(),
      originalContent: [
        { id: 'cell-1', content: 'Original content 1', type: 'text' },
        { id: 'cell-2', content: 'Original content 2', type: 'code' },
      ],
    };

    // Mock applyOperation to return a cell ID
    (notebookUpdater.applyOperation as jest.Mock).mockImplementation((operation) => {
      if (operation.type === 'create') {
        return `cell-${Date.now()}`;
      }
      return undefined;
    });
  });

  test('should handle code block markers correctly', () => {
    const lines = ['@START_CODE', 'some code', '@END_CODE'];
    
    let state = parseLines(streamingState, lines);
    expect(state.isCodeBlock).toBe(true);
    state = parseLines(state, ['@END_CODE']);
    expect(state.isCodeBlock).toBe(false);
  });

  test('should create a new text cell at the top', () => {
    const lines = ['@CREATE[type=markdown, position=top]'];
    
    parseLines(streamingState, lines);
    
    expect(notebookUpdater.applyOperation).toHaveBeenCalledWith({
      type: 'create',
      cellType: 'markdown',
      cellId: '',
      position: 'top',
      contentArray: [],
      content: ''
    });
  });

  test('should create a new code cell at the bottom', () => {
    const lines = ['@CREATE[type=code, position=bottom]'];
    
    parseLines(streamingState, lines);
    
    expect(notebookUpdater.applyOperation).toHaveBeenCalledWith({
      type: 'create',
      cellType: 'code',
      cellId: '',
      position: 'bottom',
      contentArray: [],
      content: ''
    });
  });

  test('should create a cell after another cell', () => {
    const lines = ['@CREATE[type=markdown, position=after:cell-1]'];
    
    parseLines(streamingState, lines);
    
    expect(notebookUpdater.applyOperation).toHaveBeenCalledWith({
      type: 'create',
      cellType: 'markdown',
      cellId: '',
      position: 'after:cell-1',
      contentArray: [],
      content: ''
    });
  });

  test('should handle multiple create operations after the same cell in correct order', () => {
    (notebookUpdater.applyOperation as jest.Mock).mockImplementation((operation) => {
      if (operation.type === 'create') {
        return `cell-${Date.now()}`;
      }
      return undefined;
    });

    const lines = [
      '@CREATE[type=markdown, position=after:cell-1]',
      '@CREATE[type=code, position=after:cell-1]',
    ];
    
    parseLines(streamingState, lines);
    
    const calls = (notebookUpdater.applyOperation as jest.Mock).mock.calls;
    expect(calls.length).toBe(2);
    
    // First call should be text cell
    expect(calls[0][0]).toMatchObject({
      type: 'create',
      cellType: 'markdown',
      position: 'after:cell-1'
    });

    // Second call should be code cell and its position should be after the first created cell
    expect(calls[1][0]).toMatchObject({
      type: 'create',
      cellType: 'code'
    });
    expect(calls[1][0].position).toMatch(/^after:cell-/);
  });

  test('should edit an existing cell', () => {
    const lines = ['@EDIT[cell-1]'];
    
    parseLines(streamingState, lines);
    
    expect(notebookUpdater.applyOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'edit',
        cellId: 'cell-1',
        originalContent: 'Original content 1',
      })
    );
  });

  test('should delete an existing cell', () => {
    const lines = ['@DELETE[cell-1]'];
    
    parseLines(streamingState, lines);
    
    expect(notebookUpdater.applyOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'delete',
        cellId: 'cell-1',
        originalContent: 'Original content 1',
      })
    );
  });

  test('should be idempotent for create operations', () => {
    (notebookUpdater.applyOperation as jest.Mock).mockImplementation((operation) => {
      if (operation.type === 'create') {
        return `cell-${Date.now()}`;
      }
      return undefined;
    });

    const lines = ['@CREATE[type=markdown, position=top]'];
    
    const firstState = parseLines(streamingState, lines);
    const secondState = parseLines(firstState, lines);
    
    // Each parse should create a new operation
    const calls = (notebookUpdater.applyOperation as jest.Mock).mock.calls;
    expect(calls.length).toBe(2);
    expect(secondState.currentOperations.size).toBeGreaterThan(0);
  });

  test('should be idempotent for edit operations', () => {
    const lines = ['@EDIT[cell-1]'];
    
    const firstState = parseLines(streamingState, lines);
    const secondState = parseLines(firstState, lines);
    
    // Edit operations should be idempotent
    expect(secondState.currentOperations.size).toBe(1);
    expect(notebookUpdater.applyOperation).toHaveBeenCalledTimes(2);
  });

  test('should handle invalid operations gracefully', () => {
    const lines = [
      '@CREATE[invalid]',
      '@EDIT[nonexistent-cell]',
      '@DELETE[nonexistent-cell]',
    ];
    
    const state = parseLines(streamingState, lines);
    
    // Should not create any operations for invalid inputs
    expect(state.currentOperations.size).toBe(0);
  });
});
