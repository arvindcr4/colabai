import { ModelFactory } from '../model-factory';
import { ModelProvider } from '../types';

describe('Jest Setup Validation', () => {
  it('should be able to import model factory', () => {
    expect(ModelFactory).toBeDefined();
    expect(typeof ModelFactory.createModelFromId).toBe('function');
  });

  it('should be able to import model provider enum', () => {
    expect(ModelProvider.OPENAI).toBe('openai');
    expect(ModelProvider.ANTHROPIC).toBe('anthropic');
    expect(ModelProvider.DEEPSEEK).toBe('deepseek');
    expect(ModelProvider.MISTRAL).toBe('mistral');
    expect(ModelProvider.OPENROUTER).toBe('openrouter');
  });

  it('should have chrome mock available', () => {
    expect(global.chrome).toBeDefined();
    expect(global.chrome.storage).toBeDefined();
    expect(global.chrome.storage.local).toBeDefined();
  });

  it('should have fetch mock available', () => {
    expect(global.fetch).toBeDefined();
    expect(typeof global.fetch).toBe('function');
  });
});
