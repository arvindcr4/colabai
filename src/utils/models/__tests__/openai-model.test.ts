import { OpenAIModel } from '../openai-model';
import { ModelProvider } from '../types';
import { AIServiceError, ErrorType } from '../../errors';

// Mock OpenAI SDK
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }));
});

describe('OpenAIModel', () => {
  const validConfig = {
    provider: ModelProvider.OPENAI as ModelProvider.OPENAI,
    model: 'o3-mini',
    apiKey: 'sk-test-api-key',
    temperature: 0.7
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Model Configuration', () => {
    it('should create model with o3-mini', () => {
      const model = new OpenAIModel({
        ...validConfig,
        model: 'o3-mini'
      });
      expect(model).toBeInstanceOf(OpenAIModel);
    });

    it('should create model with o3-mini-high', () => {
      const model = new OpenAIModel({
        ...validConfig,
        model: 'o3-mini-high'
      });
      expect(model).toBeInstanceOf(OpenAIModel);
    });

    it('should create model with GPT-4o', () => {
      const model = new OpenAIModel({
        ...validConfig,
        model: 'gpt-4o'
      });
      expect(model).toBeInstanceOf(OpenAIModel);
    });
  });

  describe('API Integration', () => {
    it('should call OpenAI API correctly', async () => {
      const OpenAI = require('openai');
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [{ message: { content: 'Test response' } }]
      });
      
      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }));

      const model = new OpenAIModel(validConfig);
      const result = await model.generate([{ role: 'user', content: 'Hello' }]);

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'o3-mini',
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 0.7
      });
      
      expect(result).toBe('Test response');
    });

    it('should handle streaming responses', async () => {
      const OpenAI = require('openai');
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield {
            choices: [{ delta: { content: 'Hello' } }]
          };
          yield {
            choices: [{ delta: { content: ' world' } }]
          };
          yield {
            choices: [{ finish_reason: 'stop' }]
          };
        }
      };

      const mockCreate = jest.fn().mockResolvedValue(mockStream);
      
      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }));

      const model = new OpenAIModel(validConfig);
      const chunks: string[] = [];
      
      for await (const response of model.generateStream([{ role: 'user', content: 'Hello' }])) {
        if (response.content) {
          chunks.push(response.content);
        }
        if (response.isComplete) {
          break;
        }
      }

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'o3-mini',
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 0.7,
        stream: true
      });
      
      expect(chunks).toEqual(['Hello', ' world']);
    });
  });

  describe('Model Support', () => {
    it('should support o3-mini model', () => {
      const model = new OpenAIModel({
        ...validConfig,
        model: 'o3-mini'
      });
      expect(model).toBeInstanceOf(OpenAIModel);
    });

    it('should support o3-mini-high model', () => {
      const model = new OpenAIModel({
        ...validConfig,
        model: 'o3-mini-high'
      });
      expect(model).toBeInstanceOf(OpenAIModel);
    });

    it('should support GPT-4o models', () => {
      const gpt4oModel = new OpenAIModel({
        ...validConfig,
        model: 'gpt-4o'
      });
      
      const gpt4oMiniModel = new OpenAIModel({
        ...validConfig,
        model: 'gpt-4o-mini'
      });

      expect(gpt4oModel).toBeInstanceOf(OpenAIModel);
      expect(gpt4oMiniModel).toBeInstanceOf(OpenAIModel);
    });
  });
});
