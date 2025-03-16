import { BaseModel, Message, ModelConfig } from './base.ts';

export class DeepSeekModel extends BaseModel {
  private apiKey: string;
  private baseUrl = 'https://api.deepseek.com';

  constructor(config: ModelConfig) {
    super(config);
    this.apiKey = config.apiKey;
  }

  async generateStream(messages: Message[], controller: ReadableStreamDefaultController): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model || 'deepseek-chat',
          messages,
          temperature: this.config.temperature || 0.7,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`DeepSeek API error: ${error.message || 'Unknown error'}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available from DeepSeek API');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // Decode the chunk and add it to the buffer
          buffer += decoder.decode(value, { stream: !done });

          // Split buffer by newlines and process each line
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep the last incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonData = line.slice(6); // Remove 'data: ' prefix
              if (jsonData === '[DONE]') {
                await this.writeChunk(controller, { content: '', done: true });
                return;
              }

              try {
                const data = JSON.parse(jsonData);
                const content = data.choices[0]?.delta?.content || '';
                if (content) {
                  await this.writeChunk(controller, { content, done: false });
                }
              } catch (e) {
                console.error('Error parsing DeepSeek chunk:', e);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('DeepSeek stream error:', error);
      throw error;
    }
  }
}
