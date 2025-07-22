// Model provider and configuration types

/**
 * Available model providers
 */
export enum ModelProvider {
  OPENAI = 'openai',
  DEEPSEEK = 'deepseek',
  ANTHROPIC = 'anthropic',
  MISTRAL = 'mistral',
  OPENROUTER = 'openrouter',
  GEMINI = 'gemini'
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
 * Gemini specific model configuration
 */
export interface GeminiModelConfig extends ModelConfig {
  provider: ModelProvider.GEMINI;
  model: string; // e.g., 'gemini-2.5-pro', 'gemini-2.5-flash', etc.
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
  // OpenAI Models (Current Available Models - January 2025)
  {
    id: 'o3-mini',
    name: 'OpenAI o3-mini',
    provider: ModelProvider.OPENAI,
    description: 'Latest reasoning model optimized for coding, math, and science'
  },
  {
    id: 'o3-mini-high',
    name: 'OpenAI o3-mini (High)',
    provider: ModelProvider.OPENAI,
    description: 'Higher-intelligence version of o3-mini with superior reasoning'
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: ModelProvider.OPENAI,
    description: 'Most capable GPT-4 model with multimodal capabilities'
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: ModelProvider.OPENAI,
    description: 'Smaller, faster, and cheaper GPT-4 model'
  },
  
  // DeepSeek Models (Current Available Models)
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek R1',
    provider: ModelProvider.DEEPSEEK,
    description: 'Latest reasoning model with enhanced problem-solving capabilities'
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek V3',
    provider: ModelProvider.DEEPSEEK,
    description: 'General chat model with strong coding and reasoning abilities'
  },
  
  // Anthropic Claude Models (January 2025)
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: ModelProvider.ANTHROPIC,
    description: 'Excellent Claude model for complex reasoning and coding tasks'
  },
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet (New)',
    provider: ModelProvider.ANTHROPIC,
    description: 'Latest Claude 3.7 model with enhanced capabilities'
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: ModelProvider.ANTHROPIC,
    description: 'Fastest Claude model for quick tasks and real-time responses'
  },
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4 (Preview)',
    provider: ModelProvider.ANTHROPIC,
    description: 'Most intelligent Claude model for the most complex tasks (limited availability)'
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4 (Preview)',
    provider: ModelProvider.ANTHROPIC,
    description: 'Advanced Claude model balancing intelligence and speed (limited availability)'
  },
  
  // Mistral Models (Updated July 2025)
  {
    id: 'mistral-large-latest',
    name: 'Mistral Large 2.1',
    provider: ModelProvider.MISTRAL,
    description: 'Latest flagship model with enhanced reasoning (Nov 2024)'
  },
  {
    id: 'pixtral-large-latest',
    name: 'Pixtral Large',
    provider: ModelProvider.MISTRAL,
    description: '124B multimodal, 69.4% MathVista, best open-weights vision model'
  },
  
  // Gemini Models (Current Available Models - January 2025)
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: ModelProvider.GEMINI,
    description: 'Advanced reasoning, multimodal understanding, and complex programming'
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: ModelProvider.GEMINI,
    description: 'Cost-effective, full-featured with adaptive reasoning'
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: ModelProvider.GEMINI,
    description: 'Next-generation features with enhanced capabilities and 1M token context'
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: ModelProvider.GEMINI,
    description: 'Multimodal model optimized for reasoning tasks (deprecated Sept 2025)'
  },
  
  // OpenRouter Models - Latest and Popular (July 2025)
  {
    id: 'meta-llama/llama-4-maverick',
    name: 'Llama 4 Maverick',
    provider: ModelProvider.OPENROUTER,
    description: 'MoE 400B (17B active), 256K context, sliding window (Apr 2025)'
  },
  {
    id: 'openai/o3-mini',
    name: 'OpenAI o3-mini (OR)',
    provider: ModelProvider.OPENROUTER,
    description: 'OpenAI o3-mini via OpenRouter'
  },
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro (OR)',
    provider: ModelProvider.OPENROUTER,
    description: 'Google\'s latest multimodal AI model via OpenRouter'
  },
  {
    id: 'google/gemini-2.0-flash',
    name: 'Gemini 2.0 Flash (OR)',
    provider: ModelProvider.OPENROUTER,
    description: 'Gemini 2.0 Flash via OpenRouter'
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet (OR)',
    provider: ModelProvider.OPENROUTER,
    description: 'Claude 3.5 Sonnet via OpenRouter'
  },
  {
    id: 'anthropic/claude-opus-4',
    name: 'Claude Opus 4 (OR)',
    provider: ModelProvider.OPENROUTER,
    description: 'Claude Opus 4 via OpenRouter'
  },
  {
    id: 'anthropic/claude-sonnet-4',
    name: 'Claude Sonnet 4 (OR)',
    provider: ModelProvider.OPENROUTER,
    description: 'Claude Sonnet 4 via OpenRouter'
  },
  {
    id: 'qwen/qwen-3-235b-a22b-instruct',
    name: 'Qwen3 235B',
    provider: ModelProvider.OPENROUTER,
    description: 'Qwen3 flagship MoE, 256K context, updated July 2025'
  },
  {
    id: 'deepseek/deepseek-r1-0528',
    name: 'DeepSeek R1-0528 (OR)',
    provider: ModelProvider.OPENROUTER,
    description: 'Latest DeepSeek reasoning via OpenRouter'
  },
  {
    id: 'x-ai/grok-4',
    name: 'Grok-4',
    provider: ModelProvider.OPENROUTER,
    description: 'Most intelligent xAI model with tool use & search (July 2025)'
  },
  {
    id: 'moonshot/kimi-k2',
    name: 'Kimi K2',
    provider: ModelProvider.OPENROUTER,
    description: '1T params MoE, 32B active, agentic AI with MCP support (July 2025)'
  }
];

/**
 * Get model information by ID
 */
export function getModelById(modelId: string): ModelType | undefined {
  return AVAILABLE_MODELS.find(model => model.id === modelId);
}
