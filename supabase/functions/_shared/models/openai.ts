import OpenAI from 'npm:openai';
import { BaseModel, Message, ModelConfig } from './base.ts';

export class OpenAIModel extends BaseModel {
  private client: OpenAI;

  constructor(config: ModelConfig) {
    super(config);
    this.client = new OpenAI({ apiKey: config.apiKey });
  }

  async generateStream(messages: Message[], controller: ReadableStreamDefaultController): Promise<void> {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.config.model || 'gpt-4o-mini',
        messages,
        temperature: this.config.temperature || 0.7,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          await this.writeChunk(controller, { 
            content, 
            done: false 
          });
        }
      }

      // Send final done chunk
      await this.writeChunk(controller, { 
        content: '', 
        done: true 
      });
    } catch (error) {
      console.error('OpenAI stream error:', error);
      throw error;
    }
  }
}
