import { ModelInterface, Message, ModelResponse } from './model-interface';
import { GeminiModelConfig } from './types';
import { AIServiceError, ErrorType } from '../errors';

export class GeminiModel implements ModelInterface {
  private config: GeminiModelConfig;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(config: GeminiModelConfig) {
    this.config = config;
  }

  async generate(messages: Message[]): Promise<string> {
    try {
      const formattedMessages = this.formatMessages(messages);
      const requestBody = {
        contents: formattedMessages,
        generationConfig: {
          temperature: this.config.temperature || 0.7,
          maxOutputTokens: 4096,
        }
      };
      
      const response = await fetch(`${this.baseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        await this.handleResponseError(response);
      }

      const data = await response.json();
      
      // Gemini API returns content in candidates array
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        if (candidate.content && candidate.content.parts) {
          return candidate.content.parts.map((part: any) => part.text || '').join('');
        }
      }
      
      return '';
    } catch (error: any) {
      console.error('Gemini API error:', error);
      if (error instanceof AIServiceError) {
        throw error;
      }

      throw new AIServiceError({
        type: ErrorType.SERVER,
        message: `Error calling Gemini API: ${error.message || 'Unknown error'}`,
        details: error
      });
    }
  }

  async *generateStream(messages: Message[]): AsyncGenerator<ModelResponse, void, unknown> {
    try {
      const formattedMessages = this.formatMessages(messages);
      const requestBody = {
        contents: formattedMessages,
        generationConfig: {
          temperature: this.config.temperature || 0.7,
          maxOutputTokens: 4096,
        }
      };
      
      const response = await fetch(`${this.baseUrl}/models/${this.config.model}:streamGenerateContent?key=${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        await this.handleResponseError(response);
      }

      if (!response.body) {
        throw new AIServiceError({
          type: ErrorType.SERVER,
          message: 'Gemini API returned empty response stream'
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
              
              if (parsed.candidates && parsed.candidates.length > 0) {
                const candidate = parsed.candidates[0];
                if (candidate.content && candidate.content.parts) {
                  const content = candidate.content.parts.map((part: any) => part.text || '').join('');
                  if (content) {
                    yield {
                      content,
                      isComplete: false
                    };
                  }
                }
                
                // Check if this is the final chunk
                if (candidate.finishReason) {
                  yield {
                    content: '',
                    isComplete: true
                  };
                  return;
                }
              }
            } catch (error) {
              console.error('Error parsing Gemini SSE data:', error);
            }
          }
        }
      }

      // Final completion signal
      yield {
        content: '',
        isComplete: true
      };
    } catch (error: any) {
      console.error('Gemini streaming error:', error);
      if (error instanceof AIServiceError) {
        throw error;
      }

      throw new AIServiceError({
        type: ErrorType.SERVER,
        message: `Error streaming from Gemini API: ${error.message || 'Unknown error'}`,
        details: error
      });
    }
  }

  private formatMessages(messages: Message[]): any[] {
    const formattedMessages: any[] = [];
    let systemInstruction = '';
    
    for (const msg of messages) {
      if (msg.role === 'system') {
        // Gemini handles system instructions separately
        systemInstruction = msg.content;
      } else {
        formattedMessages.push({
          role: this.mapRole(msg.role),
          parts: [{ text: msg.content }]
        });
      }
    }
    
    // If we have a system instruction, prepend it as the first user message
    if (systemInstruction && formattedMessages.length > 0) {
      formattedMessages[0] = {
        role: 'user',
        parts: [{ text: `${systemInstruction}\n\n${formattedMessages[0].parts[0].text}` }]
      };
    }
    
    return formattedMessages;
  }

  private mapRole(role: string): string {
    const roleMap: { [key: string]: string } = {
      user: 'user',
      assistant: 'model'
    };
    return roleMap[role] || 'user';
  }

  private async handleResponseError(response: Response): Promise<never> {
    const errorData = await response.json().catch(() => ({}));

    if (response.status === 401 || response.status === 403) {
      throw new AIServiceError({
        type: ErrorType.AUTHENTICATION,
        message: 'Invalid Gemini API key. Please check your API key.',
      });
    } else if (response.status === 429) {
      throw new AIServiceError({
        type: ErrorType.QUOTA_EXCEEDED,
        message: 'Gemini API rate limit exceeded. Please try again later.',
      });
    } else if (response.status === 404) {
      throw new AIServiceError({
        type: ErrorType.MODEL_ACCESS,
        message: `The requested model "${this.config.model}" is not available.`,
      });
    } else {
      throw new AIServiceError({
        type: ErrorType.SERVER,
        message: `Gemini API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`,
        details: errorData
      });
    }
  }
}
