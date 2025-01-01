const { renderHook, act } = require('@testing-library/react-hooks');
const { useStreamingState } = require('../src/pages/Content/hooks/useStreamingState');

describe('useStreamingState', () => {
  it('should not duplicate state updates in strict mode', () => {
    const { result } = renderHook(() => useStreamingState());
    const setMessageTextMock = jest.fn();
    const logs = [];
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      logs.push(args);
      originalConsoleLog(...args);
    };

    // Simulate multiple rapid updates as would happen in Strict Mode
    act(() => {
      result.current.updateStreamingContent('Hello', false, setMessageTextMock);
      result.current.updateStreamingContent('Hello', false, setMessageTextMock);
    });

    // Check logs for duplicate updates
    const stateUpdateLogs = logs.filter(log => 
      log[0] === "Setting streaming state with content:"
    );

    // Restore console.log
    console.log = originalConsoleLog;

    // Should only have one state update
    expect(stateUpdateLogs.length).toBe(1);
    expect(stateUpdateLogs[0][1]).toBe('Hello');
    expect(result.current.streamingState.fullResponse).toBe('Hello');
  });

  it('should accumulate content correctly', () => {
    const { result } = renderHook(() => useStreamingState());
    const setMessageTextMock = jest.fn();

    // Simulate streaming updates
    act(() => {
      result.current.updateStreamingContent('Hello', false, setMessageTextMock);
      result.current.updateStreamingContent(' World', false, setMessageTextMock);
    });

    expect(result.current.streamingState.fullResponse).toBe('Hello World');
  });

  it('should handle code blocks correctly', () => {
    const { result } = renderHook(() => useStreamingState());
    const setMessageTextMock = jest.fn();

    // Simulate a code block update
    act(() => {
      result.current.updateStreamingContent('@CREATE[type=code,position=top]\\n', false, setMessageTextMock);
      result.current.updateStreamingContent('console.log("test");\\n', false, setMessageTextMock);
      result.current.updateStreamingContent('@END\\n', false, setMessageTextMock);
    });

    expect(result.current.streamingState.isCodeBlock).toBe(false);
    expect(result.current.streamingState.appliedOperations.size).toBeGreaterThan(0);
  });
});