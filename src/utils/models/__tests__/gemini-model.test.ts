import { GeminiModel } from '../gemini-model';
import { ModelProvider } from '../types';
import { AIServiceError, ErrorType } from '../../errors';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('GeminiModel', () => {
  const validConfig = {
    provider: ModelProvider.GEMINI as ModelProvider.GEMINI,
    model: 'gemini-2.5-pro',
    apiKey: 'test-api-key',
    temperature: 0.7
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Model Configuration', () => {
    it('should create model with Gemini 2.5 Pro', () => {
      const model = new GeminiModel({
        ...validConfig,
        model: 'gemini-2.5-pro'
      });
      expect(model).toBeInstanceOf(GeminiModel);
    });

    it('should create model with Gemini 2.5 Flash', () => {
      const model = new GeminiModel({
        ...validConfig,
        model: 'gemini-2.5-flash'
      });
      expect(model).toBeInstanceOf(GeminiModel);
    });

    it('should create model with Gemini 2.0 Flash', () => {
      const model = new GeminiModel({
        ...validConfig,
        model: 'gemini-2.0-flash'
      });
      expect(model).toBeInstanceOf(GeminiModel);
    });
  });

  describe('API Integration', () => {
    it('should use correct API endpoint format', async () => {
      const model = new GeminiModel(validConfig);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Test response' }]
            }
          }]
        })
      });

      await model.generate([{ role: 'user', content: 'Hello' }]);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=test-api-key',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('should format request body correctly', async () => {
      const model = new GeminiModel(validConfig);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Test response' }]
            }
          }]
        })
      });

      await model.generate([
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello' }
      ]);

      const callArgs = mockFetch.mock.calls[0][1];
      const requestBody = JSON.parse(callArgs.body);
      
      expect(requestBody).toMatchObject({
        contents: expect.arrayContaining([
          {
            role: 'user',
            parts: [{ text: 'You are a helpful assistant.\n\nHello' }]
          }
        ]),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096
        }
      });
    });

    it('should handle streaming responses', async () => {
      const model = new GeminiModel(validConfig);
      
      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"candidates":[{"content":{"parts":[{"text":"Hello"}]}}]}\n\n')
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"candidates":[{"content":{"parts":[{"text":" world"}]}}]}\n\n')
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"candidates":[{"finishReason":"STOP"}]}\n\n')
          })
          .mockResolvedValueOnce({
            done: true,
            value: undefined
          })
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader
        }
      });

      const chunks: string[] = [];
      
      for await (const response of model.generateStream([{ role: 'user', content: 'Hello' }])) {
        if (response.content) {
          chunks.push(response.content);
        }
        if (response.isComplete) {
          break;
        }
      }

      expect(chunks).toEqual(['Hello', ' world']);
    });
  });

  describe('Model Support', () => {
    it('should support Gemini 2.5 models', () => {
      const proModel = new GeminiModel({
        ...validConfig,
        model: 'gemini-2.5-pro'
      });
      
      const flashModel = new GeminiModel({
        ...validConfig,
        model: 'gemini-2.5-flash'
      });

      expect(proModel).toBeInstanceOf(GeminiModel);
      expect(flashModel).toBeInstanceOf(GeminiModel);
    });

    it('should support Gemini 2.0 models', () => {
      const model = new GeminiModel({
        ...validConfig,
        model: 'gemini-2.0-flash'
      });
      expect(model).toBeInstanceOf(GeminiModel);
    });

    it('should support legacy Gemini 1.5 models', () => {
      const model = new GeminiModel({
        ...validConfig,
        model: 'gemini-1.5-pro'
      });
      expect(model).toBeInstanceOf(GeminiModel);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors correctly', async () => {
      const model = new GeminiModel(validConfig);
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message: 'Invalid request'
          }
        })
      });

      try {
        await model.generate([{ role: 'user', content: 'Hello' }]);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).toBeInstanceOf(AIServiceError);
      }
    });
  });
});
