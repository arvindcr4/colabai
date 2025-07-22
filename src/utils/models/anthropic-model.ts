import { ModelInterface, Message, ModelResponse } from './model-interface';
import { AnthropicModelConfig } from './types';
import { AIServiceError, ErrorType } from '../errors';

export class AnthropicModel implements ModelInterface {
  private config: AnthropicModelConfig;
  private baseUrl = 'https://api.anthropic.com/v1';

  constructor(config: AnthropicModelConfig) {
    this.config = config;
  }

  async generate(messages: Message[]): Promise<string> {
    try {
      const { systemMessage, formattedMessages } = this.formatMessages(messages);
      const requestBody: any = {
        model: this.config.model,
        messages: formattedMessages,
        temperature: this.config.temperature || 0.7,
        max_tokens: 4096
      };
      
      if (systemMessage) {
        requestBody.system = systemMessage;
      }
      
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        await this.handleResponseError(response);
      }

      const data = await response.json();
      // Anthropic API returns content in a different structure
      if (data.content && Array.isArray(data.content)) {
        return data.content.map((item: any) => item.text || '').join('');
      }
      return data.content?.[0]?.text || '';
    } catch (error: any) {
      console.error('Anthropic API error:', error);
      if (error instanceof AIServiceError) {
        throw error;
      }

      throw new AIServiceError({
        type: ErrorType.SERVER,
        message: `Error calling Anthropic API: ${error.message || 'Unknown error'}`,
        details: error
      });
    }
  }

  async *generateStream(messages: Message[]): AsyncGenerator<ModelResponse, void, unknown> {
    try {
      const { systemMessage, formattedMessages } = this.formatMessages(messages);
      const requestBody: any = {
        model: this.config.model,
        messages: formattedMessages,
        temperature: this.config.temperature || 0.7,
        max_tokens: 4096,
        stream: true
      };
      
      if (systemMessage) {
        requestBody.system = systemMessage;
      }
      
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        await this.handleResponseError(response);
      }

      if (!response.body) {
        throw new AIServiceError({
          type: ErrorType.SERVER,
          message: 'Anthropic API returned empty response stream'
        });
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          
          if (trimmedLine.startsWith('event: ') || trimmedLine.startsWith('data: ')) {
            if (trimmedLine.startsWith('data: ')) {
              const data = trimmedLine.slice(6);

              if (data === '[DONE]') {
                yield {
                  content: '',
                  isComplete: true
                };
                return;
              }

              try {
                const parsed = JSON.parse(data);
                
                // Handle different SSE event types for Anthropic
                if (parsed.type === 'message_start') {
                  // Message started
                  continue;
                } else if (parsed.type === 'content_block_start') {
                  // Content block started
                  continue;
                } else if (parsed.type === 'content_block_delta') {
                  // Content delta - this contains the actual text
                  const content = parsed.delta?.text || '';
                  if (content) {
                    yield {
                      content,
                      isComplete: false
                    };
                  }
                } else if (parsed.type === 'content_block_stop') {
                  // Content block stopped
                  continue;
                } else if (parsed.type === 'message_delta') {
                  // Message delta with stop reason
                  const isComplete = parsed.delta?.stop_reason === 'end_turn';
                  if (isComplete) {
                    yield {
                      content: '',
                      isComplete: true
                    };
                    return;
                  }
                } else if (parsed.type === 'message_stop') {
                  // Message stopped - end of stream
                  yield {
                    content: '',
                    isComplete: true
                  };
                  return;
                }
              } catch (error) {
                console.error('Error parsing SSE data:', error);
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Anthropic streaming error:', error);
      if (error instanceof AIServiceError) {
        throw error;
      }

      throw new AIServiceError({
        type: ErrorType.SERVER,
        message: `Error streaming from Anthropic API: ${error.message || 'Unknown error'}`,
        details: error
      });
    }
  }

  private formatMessages(messages: Message[]): { systemMessage?: string, formattedMessages: any[] } {
    let systemMessage: string | undefined;
    const formattedMessages: any[] = [];
    
    for (const msg of messages) {
      if (msg.role === 'system') {
        // Anthropic handles system messages separately
        systemMessage = msg.content;
      } else {
        formattedMessages.push({
          role: this.mapRole(msg.role),
          content: msg.content
        });
      }
    }
    
    return { systemMessage, formattedMessages };
  }

  private mapRole(role: string): string {
    const roleMap: { [key: string]: string } = {
      system: 'system',
      user: 'user',
      assistant: 'assistant'
    };
    return roleMap[role] || role;
  }

  private async handleResponseError(response: Response): Promise<never> {
    const errorData = await response.json().catch(() => ({}));
    
    console.error(`Anthropic API error - Status: ${response.status}, Model: ${this.config.model}, Response:`, errorData);

    if (response.status === 401) {
      throw new AIServiceError({
        type: ErrorType.AUTHENTICATION,
        message: 'Invalid Anthropic API key. Please check your API key.',
      });
    } else if (response.status === 429) {
      throw new AIServiceError({
        type: ErrorType.QUOTA_EXCEEDED,
        message: 'Anthropic API rate limit exceeded. Please try again later.',
      });
    } else if (response.status === 404) {
      throw new AIServiceError({
        type: ErrorType.MODEL_ACCESS,
        message: `The requested model "${this.config.model}" is not available with your API key.`,
      });
    } else if (response.status === 400 && errorData.error?.type === 'invalid_request_error') {
      // Handle model not found or invalid model name
      if (errorData.error?.message?.includes('model')) {
        throw new AIServiceError({
          type: ErrorType.MODEL_ACCESS,
          message: `The model "${this.config.model}" is not available. Please try Claude 3.5 Sonnet instead.`,
        });
      }
      throw new AIServiceError({
        type: ErrorType.SERVER,
        message: `Invalid request: ${errorData.error?.message || 'Unknown error'}`,
        details: errorData
      });
    } else {
      throw new AIServiceError({
        type: ErrorType.SERVER,
        message: `Anthropic API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`,
        details: errorData
      });
    }
  }
}
