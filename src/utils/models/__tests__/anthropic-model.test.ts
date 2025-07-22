import { AnthropicModel } from '../anthropic-model';
import { ModelProvider } from '../types';
import { AIServiceError, ErrorType } from '../../errors';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AnthropicModel', () => {
  const validConfig = {
    provider: ModelProvider.ANTHROPIC as ModelProvider.ANTHROPIC,
    model: 'claude-opus-4-20250514',
    apiKey: 'sk-ant-test-api-key',
    temperature: 0.7
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Model Configuration', () => {
    it('should create model with Claude 4 Opus', () => {
      const model = new AnthropicModel({
        ...validConfig,
        model: 'claude-opus-4-20250514'
      });
      expect(model).toBeInstanceOf(AnthropicModel);
    });

    it('should create model with Claude 4 Sonnet', () => {
      const model = new AnthropicModel({
        ...validConfig,
        model: 'claude-sonnet-4-20250514'
      });
      expect(model).toBeInstanceOf(AnthropicModel);
    });


  });

  describe('API Request Headers', () => {
    it('should use correct API version header', async () => {
      const model = new AnthropicModel(validConfig);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'Test response' }]
        })
      });

      await model.generate([{ role: 'user', content: 'Hello' }]);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          headers: expect.objectContaining({
            'anthropic-version': '2023-06-01'
          })
        })
      );
    });

    it('should include correct API key in headers', async () => {
      const model = new AnthropicModel(validConfig);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'Test response' }]
        })
      });

      await model.generate([{ role: 'user', content: 'Hello' }]);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': 'sk-ant-test-api-key'
          })
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors', async () => {
      const model = new AnthropicModel(validConfig);
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API key' } })
      });

      try {
        await model.generate([{ role: 'user', content: 'Hello' }]);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.type).toBe(ErrorType.AUTHENTICATION);
        expect(error.message).toContain('Invalid Anthropic API key');
      }
    });

    it('should handle model access errors', async () => {
      const model = new AnthropicModel(validConfig);
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: { message: 'Model not found' } })
      });

      try {
        await model.generate([{ role: 'user', content: 'Hello' }]);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.type).toBe(ErrorType.MODEL_ACCESS);
        expect(error.message).toContain('not available with your API key');
      }
    });

    it('should handle rate limit errors', async () => {
      const model = new AnthropicModel(validConfig);
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit exceeded' } })
      });

      try {
        await model.generate([{ role: 'user', content: 'Hello' }]);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.type).toBe(ErrorType.QUOTA_EXCEEDED);
        expect(error.message).toContain('rate limit exceeded');
      }
    });
  });

  describe('Message Formatting', () => {
    it('should correctly format messages with system prompt', async () => {
      const model = new AnthropicModel(validConfig);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'Test response' }]
        })
      });

      const messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello' }
      ];

      await model.generate(messages);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          body: expect.stringContaining('"system":"You are a helpful assistant."')
        })
      );

      const callArgs = mockFetch.mock.calls[0][1];
      const requestBody = JSON.parse(callArgs.body);
      
      expect(requestBody.system).toBe('You are a helpful assistant.');
      expect(requestBody.messages).toEqual([
        { role: 'user', content: 'Hello' }
      ]);
    });
  });
});
