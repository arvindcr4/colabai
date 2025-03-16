import OpenAI from 'openai';
import { ModelInterface, Message, ModelResponse } from './model-interface';
import { OpenAIModelConfig } from './types';
import { AIServiceError, ErrorType } from '../errors';

export class OpenAIModel implements ModelInterface {
  private client: OpenAI;
  private config: OpenAIModelConfig;

  constructor(config: OpenAIModelConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      dangerouslyAllowBrowser: true // Required for browser usage
    });
  }

  async generate(messages: Message[]): Promise<string> {
    try {
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })) as OpenAI.ChatCompletionMessageParam[];

      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages: formattedMessages,
        temperature: this.config.temperature || 0.7,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      this.handleAPIError(error);
      throw error; // This won't reach if handleAPIError throws
    }
  }

  async *generateStream(messages: Message[]): AsyncGenerator<ModelResponse, void, unknown> {
    try {
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })) as OpenAI.ChatCompletionMessageParam[];

      const stream = await this.client.chat.completions.create({
        model: this.config.model,
        messages: formattedMessages,
        temperature: this.config.temperature || 0.7,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        const isComplete = chunk.choices[0]?.finish_reason === 'stop';
        
        yield {
          content,
          isComplete
        };
      }
    } catch (error: any) {
      console.error('OpenAI streaming error:', error);
      this.handleAPIError(error);
    }
  }

  private handleAPIError(error: any): never {
    if (error.status === 401) {
      throw new AIServiceError({
        type: ErrorType.AUTHENTICATION,
        message: 'Invalid OpenAI API key. Please check your API key in the extension options.',
      });
    } else if (error.status === 429) {
      throw new AIServiceError({
        type: ErrorType.QUOTA_EXCEEDED,
        message: 'OpenAI API rate limit exceeded. Please try again later.',
      });
    } else if (error.status === 404) {
      throw new AIServiceError({
        type: ErrorType.MODEL_ACCESS,
        message: `The requested model "${this.config.model}" is not available with your API key.`,
      });
    } else {
      throw new AIServiceError({
        type: ErrorType.SERVER,
        message: `Error calling OpenAI API: ${error.message || 'Unknown error'}`,
        details: error
      });
    }
  }
}
