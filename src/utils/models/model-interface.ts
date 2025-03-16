/**
 * Interface for model providers that defines required methods
 */

export interface Message {
  role: string;
  content: string;
}

export interface ModelResponse {
  content: string;
  isComplete: boolean;
}

export interface ModelInterface {
  /**
   * Generate a completion from the model with streaming support
   */
  generateStream(messages: Message[]): AsyncGenerator<ModelResponse, void, unknown>;
  
  /**
   * Generate a completion from the model without streaming
   */
  generate(messages: Message[]): Promise<string>;
}
