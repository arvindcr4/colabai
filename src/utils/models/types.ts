// Model provider and configuration types

/**
 * Available model providers
 */
export enum ModelProvider {
  OPENAI = 'openai',
  DEEPSEEK = 'deepseek',
  ANTHROPIC = 'anthropic',
  MISTRAL = 'mistral',
  OPENROUTER = 'openrouter'
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
 * Anthropic specific model configuration
 */
export interface AnthropicModelConfig extends ModelConfig {
  provider: ModelProvider.ANTHROPIC;
  model: string; // e.g., 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', etc.
}

/**
 * Mistral specific model configuration
 */
export interface MistralModelConfig extends ModelConfig {
  provider: ModelProvider.MISTRAL;
  model: string; // e.g., 'mistral-medium', 'mixtral-8x22b-instruct', etc.
}

/**
 * OpenRouter specific model configuration
 */
export interface OpenRouterModelConfig extends ModelConfig {
  provider: ModelProvider.OPENROUTER;
  model: string; // e.g., 'meta-llama/llama-3-70b-instruct', 'google/gemma-7b-it', etc.
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
  // OpenAI Models
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: ModelProvider.OPENAI,
    description: 'Latest OpenAI multimodal model with enhanced capabilities'
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: ModelProvider.OPENAI,
    description: 'Smaller, faster version of GPT-4o'
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: ModelProvider.OPENAI,
    description: 'Enhanced GPT-4 with improved speed and capabilities'
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: ModelProvider.OPENAI,
    description: 'Advanced reasoning and complex task completion'
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: ModelProvider.OPENAI,
    description: 'Fast and efficient model for general tasks'
  },
  
  // DeepSeek Models
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: ModelProvider.DEEPSEEK,
    description: 'Latest reasoning model with enhanced logical capabilities'
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    provider: ModelProvider.DEEPSEEK,
    description: 'General purpose conversational AI model'
  },
  {
    id: 'deepseek-coder',
    name: 'DeepSeek Coder',
    provider: ModelProvider.DEEPSEEK,
    description: 'Specialized model for code generation and programming tasks'
  },
  
  // Anthropic Claude Models
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet (New)',
    provider: ModelProvider.ANTHROPIC,
    description: 'Latest Claude 3.5 Sonnet with improved computer use and coding'
  },
  {
    id: 'claude-3-5-sonnet-20240620',
    name: 'Claude 3.5 Sonnet',
    provider: ModelProvider.ANTHROPIC,
    description: 'Most intelligent Claude model with best-in-class performance'
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: ModelProvider.ANTHROPIC,
    description: 'Fast and affordable model with improved capabilities'
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: ModelProvider.ANTHROPIC,
    description: 'Most powerful Claude 3 model for complex tasks'
  },
  {
    id: 'claude-3-sonnet-20240229',
    name: 'Claude 3 Sonnet',
    provider: ModelProvider.ANTHROPIC,
    description: 'Balanced Claude 3 model for general use'
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: ModelProvider.ANTHROPIC,
    description: 'Fastest and most affordable Claude 3 model'
  },
  
  // Mistral Models
  {
    id: 'mistral-large-2411',
    name: 'Mistral Large (2411)',
    provider: ModelProvider.MISTRAL,
    description: 'Latest flagship model with enhanced reasoning and coding'
  },
  {
    id: 'mistral-large-2407',
    name: 'Mistral Large (2407)',
    provider: ModelProvider.MISTRAL,
    description: 'High-performance model for complex tasks'
  },
  {
    id: 'mistral-small-2409',
    name: 'Mistral Small (2409)',
    provider: ModelProvider.MISTRAL,
    description: 'Cost-effective model with good performance'
  },
  {
    id: 'pixtral-12b-2409',
    name: 'Pixtral 12B',
    provider: ModelProvider.MISTRAL,
    description: 'Multimodal model capable of processing images and text'
  },
  {
    id: 'mixtral-8x7b-instruct',
    name: 'Mixtral 8x7B Instruct',
    provider: ModelProvider.MISTRAL,
    description: 'Mixture of experts model for efficient performance'
  },
  {
    id: 'mixtral-8x22b-instruct',
    name: 'Mixtral 8x22B Instruct',
    provider: ModelProvider.MISTRAL,
    description: 'Large mixture of experts model for complex reasoning'
  },
  
  // OpenRouter Models - Popular and Recent
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B Instruct',
    provider: ModelProvider.OPENROUTER,
    description: 'Latest Meta Llama model with improved capabilities'
  },
  {
    id: 'meta-llama/llama-3.2-90b-vision-instruct',
    name: 'Llama 3.2 90B Vision Instruct',
    provider: ModelProvider.OPENROUTER,
    description: 'Large multimodal model with vision capabilities'
  },
  {
    id: 'meta-llama/llama-3.2-11b-vision-instruct',
    name: 'Llama 3.2 11B Vision Instruct',
    provider: ModelProvider.OPENROUTER,
    description: 'Efficient multimodal model with vision capabilities'
  },
  {
    id: 'meta-llama/llama-3.1-405b-instruct',
    name: 'Llama 3.1 405B Instruct',
    provider: ModelProvider.OPENROUTER,
    description: 'Largest open-source language model'
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B Instruct',
    provider: ModelProvider.OPENROUTER,
    description: 'High-performance open-source model'
  },
  {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini Pro 1.5',
    provider: ModelProvider.OPENROUTER,
    description: 'Google\'s advanced multimodal AI model'
  },
  {
    id: 'google/gemini-flash-1.5',
    name: 'Gemini Flash 1.5',
    provider: ModelProvider.OPENROUTER,
    description: 'Fast and efficient Google model'
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet (OpenRouter)',
    provider: ModelProvider.OPENROUTER,
    description: 'Claude 3.5 Sonnet via OpenRouter routing'
  },
  {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus (OpenRouter)',
    provider: ModelProvider.OPENROUTER,
    description: 'Claude 3 Opus via OpenRouter routing'
  },
  {
    id: 'mistralai/mistral-large',
    name: 'Mistral Large (OpenRouter)',
    provider: ModelProvider.OPENROUTER,
    description: 'Mistral Large via OpenRouter routing'
  },
  {
    id: 'cohere/command-r-plus',
    name: 'Command R+',
    provider: ModelProvider.OPENROUTER,
    description: 'Cohere\'s flagship model for complex reasoning'
  },
  {
    id: 'qwen/qwen-2.5-72b-instruct',
    name: 'Qwen 2.5 72B Instruct',
    provider: ModelProvider.OPENROUTER,
    description: 'Alibaba\'s advanced multilingual model'
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1 (OpenRouter)',
    provider: ModelProvider.OPENROUTER,
    description: 'DeepSeek R1 via OpenRouter routing'
  },
  {
    id: 'x-ai/grok-2',
    name: 'Grok-2',
    provider: ModelProvider.OPENROUTER,
    description: 'X.AI\'s conversational AI model'
  }
];

/**
 * Get model information by ID
 */
export function getModelById(modelId: string): ModelType | undefined {
  return AVAILABLE_MODELS.find(model => model.id === modelId);
}
