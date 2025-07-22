import { ModelInterface } from './model-interface';
import { MistralModel } from './mistral-model';
import { OpenAIModel } from './openai-model';
import { DeepSeekModel } from './deepseek-model';
import { AnthropicModel } from './anthropic-model';
import { OpenRouterModel } from './openrouter-model';
import { GeminiModel } from './gemini-model';
import { ModelConfig, ModelProvider, OpenAIModelConfig, DeepSeekModelConfig, MistralModelConfig, AnthropicModelConfig, OpenRouterModelConfig, GeminiModelConfig, getModelById } from './types';
import { AIServiceError, ErrorType } from '../errors';

/**
 * Factory class for creating model implementations based on provider
 */
export class ModelFactory {
  /**
   * Create a model instance based on configuration
   */
  static createModel(config: ModelConfig): ModelInterface {
    switch (config.provider) {
      case ModelProvider.OPENAI:
        return new OpenAIModel(config as OpenAIModelConfig);
      case ModelProvider.DEEPSEEK:
        return new DeepSeekModel(config as DeepSeekModelConfig);
      case ModelProvider.MISTRAL:
        return new MistralModel(config as MistralModelConfig);
      case ModelProvider.ANTHROPIC:
        return new AnthropicModel(config as AnthropicModelConfig);
      case ModelProvider.OPENROUTER:
        return new OpenRouterModel(config as OpenRouterModelConfig);
      case ModelProvider.GEMINI:
        return new GeminiModel(config as GeminiModelConfig);
      default:
        throw new AIServiceError({
          type: ErrorType.CONFIGURATION,
          message: `Unsupported model provider: ${config.provider}`
        });
    }
  }

  /**
   * Create a model instance from model ID and API key
   */
  static createModelFromId(modelId: string, apiKey: string, temperature?: number): ModelInterface {
    const modelInfo = getModelById(modelId);
    
    if (!modelInfo) {
      throw new AIServiceError({
        type: ErrorType.CONFIGURATION,
        message: `Unknown model ID: ${modelId}`
      });
    }

    if (!apiKey || apiKey.trim() === '') {
      throw new AIServiceError({
        type: ErrorType.CONFIGURATION,
        message: `API key is required for ${modelInfo.provider} provider`
      });
    }

    const config: ModelConfig = {
      provider: modelInfo.provider,
      model: modelId,
      apiKey,
      temperature
    };

    return this.createModel(config);
  }
}
