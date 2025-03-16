// Model provider and configuration types

/**
 * Available model providers
 */
export enum ModelProvider {
  OPENAI = 'openai',
  DEEPSEEK = 'deepseek'
}

/**
 * Base model configuration interface
 */
export interface ModelConfig {
  provider: ModelProvider;
  model: string;
  temperature?: number;
  apiKey: string;
}

/**
 * OpenAI specific model configuration
 */
export interface OpenAIModelConfig extends ModelConfig {
  provider: ModelProvider.OPENAI;
  model: string; // e.g., 'gpt-4o', 'gpt-3.5-turbo', etc.
}

/**
 * DeepSeek specific model configuration
 */
export interface DeepSeekModelConfig extends ModelConfig {
  provider: ModelProvider.DEEPSEEK;
  model: string; // e.g., 'deepseek-chat', 'deepseek-coder', etc.
}

/**
 * Model type with provider information
 */
export interface ModelType {
  id: string;
  name: string;
  provider: ModelProvider;
  description?: string;
}

/**
 * Available model definitions
 */
export const AVAILABLE_MODELS: ModelType[] = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: ModelProvider.OPENAI,
    description: 'Smaller, faster version of GPT-4o'
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: ModelProvider.OPENAI,
    description: 'Latest OpenAI multimodal model'
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    provider: ModelProvider.DEEPSEEK,
    description: 'DeepSeek chat assistant model'
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek R1',
    provider: ModelProvider.DEEPSEEK,
    description: 'Specialized in code generation and understanding'
  }
];

/**
 * Get model information by ID
 */
export function getModelById(modelId: string): ModelType | undefined {
  return AVAILABLE_MODELS.find(model => model.id === modelId);
}
