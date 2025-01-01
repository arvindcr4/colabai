import { AIModel, ModelConfig } from './base.ts';
import { OpenAIModel } from './openai.ts';
import { ModelType } from '../subscription-plans.ts';

export enum ModelProvider {
  OpenAI = 'openai',
  // Add more providers as needed
  // Claude = 'claude',
  // Gemini = 'gemini',
}

export class ModelFactory {
  static createModel(provider: ModelProvider, config: ModelConfig): AIModel {
    switch (provider) {
      case ModelProvider.OpenAI:
        return new OpenAIModel(config);
      // Add more cases as you add more providers
      // case ModelProvider.Claude:
      //   return new ClaudeModel(config);
      default:
        throw new Error(`Unsupported model provider: ${provider}`);
    }
  }

  static getProviderFromModel(modelName: string): ModelProvider {
    // Handle custom GPT-4O models
    if (modelName === ModelType.GPT4O || modelName === ModelType.GPT4O_MINI) {
      return ModelProvider.OpenAI;
    }
    
    // Handle standard OpenAI models
    if (modelName.startsWith('gpt-')) {
      return ModelProvider.OpenAI;
    }
    
    // Add more model name patterns as you add more providers
    // if (modelName.startsWith('claude-')) {
    //   return ModelProvider.Claude;
    // }
    
    throw new Error(`Unknown model: ${modelName}`);
  }
}
