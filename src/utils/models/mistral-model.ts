import { ModelInterface, Message, ModelResponse } from './model-interface';
import { MistralModelConfig } from './types';
import { AIServiceError, ErrorType } from '../errors';

export class MistralModel implements ModelInterface {
  private config: MistralModelConfig;
  private baseUrl = 'https://api.mistral.ai/v1';

  constructor(config: MistralModelConfig) {
    this.config = config;
  }

  async generate(messages: Message[]): Promise<string> {
    try {
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: formattedMessages,
          temperature: this.config.temperature || 0.7,
        })
      });

      if (!response.ok) {
        await this.handleResponseError(response);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error: any) {
      console.error('Mistral API error:', error);
      if (error instanceof AIServiceError) {
        throw error;
      }
      
      throw new AIServiceError({
        type: ErrorType.SERVER,
        message: `Error calling Mistral API: ${error.message || 'Unknown error'}`,
        details: error
      });
    }
  }

  async *generateStream(messages: Message[]): AsyncGenerator<ModelResponse, void, unknown> {
    try {
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: formattedMessages,
          temperature: this.config.temperature || 0.7,
          stream: true
        })
      });

      if (!response.ok) {
        await this.handleResponseError(response);
      }

      if (!response.body) {
        throw new AIServiceError({
          type: ErrorType.SERVER,
          message: 'Mistral API returned empty response stream'
        });
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process the buffer to extract SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              yield {
                content: '',
                isComplete: true
              };
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              const isComplete = parsed.choices[0]?.finish_reason === 'stop';
              
              yield {
                content,
                isComplete
              };
              
              if (isComplete) return;
            } catch (error) {
              console.error('Error parsing SSE data:', error);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Mistral streaming error:', error);
      if (error instanceof AIServiceError) {
        throw error;
      }
      
      throw new AIServiceError({
        type: ErrorType.SERVER,
        message: `Error streaming from Mistral API: ${error.message || 'Unknown error'}`,
        details: error
      });
    }
  }

  private async handleResponseError(response: Response): Promise<never> {
    const errorData = await response.json().catch(() => ({}));
    
    if (response.status === 401) {
      throw new AIServiceError({
        type: ErrorType.AUTHENTICATION,
        message: 'Invalid Mistral API key. Please check your API key in the extension options.',
      });
    } else if (response.status === 429) {
      throw new AIServiceError({
        type: ErrorType.QUOTA_EXCEEDED,
        message: 'Mistral API rate limit exceeded. Please try again later.',
      });
    } else if (response.status === 404) {
      throw new AIServiceError({
        type: ErrorType.MODEL_ACCESS,
        message: `The requested model "${this.config.model}" is not available with your API key.`,
      });
    } else {
      throw new AIServiceError({
        type: ErrorType.SERVER,
        message: `Mistral API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`,
        details: errorData
      });
    }
  }
}
