import 'openai/shims/node';


// Mock Chrome APIs
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
  },
} as any;

// Mock fetch API
global.fetch = jest.fn();

// Mock TextDecoder and TextEncoder
if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = class MockTextDecoder {
    decode(input?: Uint8Array): string {
      if (!input) return '';
      return String.fromCharCode.apply(null, Array.from(input));
    }
  } as any;
}

if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = class MockTextEncoder {
    encode(input = ''): Uint8Array {
      const result = new Uint8Array(input.length);
      for (let i = 0; i < input.length; i++) {
        result[i] = input.charCodeAt(i);
      }
      return result;
    }
  } as any;
}

// Mock ReadableStream for streaming tests
global.ReadableStream = class MockReadableStream {
  constructor() {}
  
  getReader() {
    return {
      read: jest.fn(),
    };
  }
} as any;

// Create a mock response for streaming tests
export const createMockStreamResponse = (chunks: string[], shouldError = false) => {
  let chunkIndex = 0;
  
  return {
    ok: !shouldError,
    status: shouldError ? 401 : 200,
    json: jest.fn().mockResolvedValue(
      shouldError ? { error: { message: 'Test error' } } : {}
    ),
    body: {
      getReader: () => ({
        read: jest.fn().mockImplementation(() => {
          if (shouldError) {
            return Promise.reject(new Error('Stream error'));
          }
          
          if (chunkIndex < chunks.length) {
            const chunk = chunks[chunkIndex++];
            return Promise.resolve({
              done: false,
              value: new TextEncoder().encode(chunk),
            });
          }
          return Promise.resolve({ done: true });
        }),
      }),
    },
  };
};
