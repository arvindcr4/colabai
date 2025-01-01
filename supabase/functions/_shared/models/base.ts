export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

export interface ModelConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIModel {
  generateStream(messages: Message[], controller: ReadableStreamDefaultController): Promise<void>;
  validateConfig(): boolean;
}

export abstract class BaseModel implements AIModel {
  protected config: ModelConfig;

  constructor(config: ModelConfig) {
    this.config = config;
  }

  abstract generateStream(messages: Message[], controller: ReadableStreamDefaultController): Promise<void>;

  validateConfig(): boolean {
    return !!this.config.apiKey;
  }

  protected async writeChunk(controller: ReadableStreamDefaultController, chunk: StreamChunk) {
    const encoder = new TextEncoder();
    controller.enqueue(encoder.encode(JSON.stringify(chunk) + '\n'));
  }
}
