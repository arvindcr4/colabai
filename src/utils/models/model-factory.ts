import { ModelInterface } from './model-interface';
import { OpenAIModel } from './openai-model';
import { DeepSeekModel } from './deepseek-model';
import { ModelConfig, ModelProvider, OpenAIModelConfig, DeepSeekModelConfig, getModelById } from './types';
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

    const config: ModelConfig = {
      provider: modelInfo.provider,
      model: modelId,
      apiKey,
      temperature
    };

    return this.createModel(config);
  }
}
