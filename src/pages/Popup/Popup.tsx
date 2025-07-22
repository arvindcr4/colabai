import React, { useEffect, useState, useMemo } from 'react';
import {
  AVAILABLE_MODELS,
  ModelProvider,
  ModelType,
} from '../../utils/models/types';
import '../../styles.css';

const Popup = () => {
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [deepseekApiKey, setDeepseekApiKey] = useState('');
  const [anthropicApiKey, setAnthropicApiKey] = useState('');
  const [mistralApiKey, setMistralApiKey] = useState('');
  const [openrouterApiKey, setOpenrouterApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('gpt-4.1-mini');
  const [allow_reduce_content, setAllowReduceContent] = useState(false);

  useEffect(() => {
    // Load saved API keys and selected model from storage
    chrome.storage.local.get(
      [
        'openai_api_key',
        'deepseek_api_key',
        'anthropic_api_key',
        'mistral_api_key',
        'openrouter_api_key',
        'gemini_api_key',
        'selected_model',
        'allow_reduce_content',
      ],
      (result) => {
        if (chrome.runtime.lastError) {
          console.error('Failed to load settings:', chrome.runtime.lastError);
          setError('Failed to load settings');
          setLoading(false);
          return;
        }

        if (result.openai_api_key) {
          setOpenaiApiKey(result.openai_api_key);
        }

        if (result.deepseek_api_key) {
          setDeepseekApiKey(result.deepseek_api_key);
        }

        if (result.anthropic_api_key) {
          setAnthropicApiKey(result.anthropic_api_key);
        }

        if (result.mistral_api_key) {
          setMistralApiKey(result.mistral_api_key);
        }

        if (result.openrouter_api_key) {
          setOpenrouterApiKey(result.openrouter_api_key);
        }

        if (result.gemini_api_key) {
          setGeminiApiKey(result.gemini_api_key);
        }

        if (result.selected_model) {
          // Validate that the model exists
          const modelExists = AVAILABLE_MODELS.some(m => m.id === result.selected_model);
          if (modelExists) {
            setSelectedModel(result.selected_model);
          } else {
            // Fallback to first available model
            const defaultModel = AVAILABLE_MODELS[0]?.id || 'gpt-4o-mini';
            setSelectedModel(defaultModel);
          }
        }

        if (result.allow_reduce_content) {
          setAllowReduceContent(result.allow_reduce_content);
        }

        setLoading(false);
      }
    );
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      // Save settings to chrome storage
      await chrome.storage.local.set({
        openai_api_key: openaiApiKey,
        deepseek_api_key: deepseekApiKey,
        anthropic_api_key: anthropicApiKey,
        mistral_api_key: mistralApiKey,
        openrouter_api_key: openrouterApiKey,
        gemini_api_key: geminiApiKey,
        selected_model: selectedModel,
        allow_reduce_content: allow_reduce_content,
      });

      setSavedMessage('Settings saved successfully!');
      setTimeout(() => setSavedMessage(null), 3000);
      setLoading(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings');
      setLoading(false);
    }
  };

  // Group models by provider - memoized for performance
  const modelsByProvider = useMemo(() => {
    return AVAILABLE_MODELS.reduce((acc, model) => {
      let providerKey: string;
      
      switch (model.provider) {
        case ModelProvider.OPENAI:
          providerKey = 'OpenAI';
          break;
        case ModelProvider.DEEPSEEK:
          providerKey = 'DeepSeek';
          break;
        case ModelProvider.ANTHROPIC:
          providerKey = 'Anthropic';
          break;
        case ModelProvider.MISTRAL:
          providerKey = 'Mistral';
          break;
        case ModelProvider.OPENROUTER:
          providerKey = 'OpenRouter';
          break;
        case ModelProvider.GEMINI:
          providerKey = 'Gemini';
          break;
        default:
          providerKey = 'Other';
      }

      if (!acc[providerKey]) {
        acc[providerKey] = [];
      }

      acc[providerKey].push(model);
      return acc;
    }, {} as Record<string, ModelType[]>);
  }, []);

  if (loading) {
    return (
      <div className="w-[350px] min-h-[300px] bg-gray-900 text-gray-100 p-6 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-orange-600"></div>
          <span className="text-gray-300">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[400px] min-h-[500px] bg-gray-900 text-gray-100 p-6 overflow-y-auto">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gray-800 p-2 rounded-lg">
              <svg
                className="w-6 h-6 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                ></path>
              </svg>
            </div>
            <h1 className="text-xl font-semibold">ColabAI</h1>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-4 space-y-4">
              <h2 className="text-lg font-medium">API Settings</h2>

              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="openaiApiKey"
                    className="block text-sm font-medium text-gray-400 mb-1"
                  >
                    OpenAI API Key
                  </label>
                  <input
                    type="password"
                    id="openaiApiKey"
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md 
                           text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Required for OpenAI models
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="deepseekApiKey"
                    className="block text-sm font-medium text-gray-400 mb-1"
                  >
                    DeepSeek API Key
                  </label>
                  <input
                    type="password"
                    id="deepseekApiKey"
                    value={deepseekApiKey}
                    onChange={(e) => setDeepseekApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md 
                           text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Required for DeepSeek models
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="anthropicApiKey"
                    className="block text-sm font-medium text-gray-400 mb-1"
                  >
                    Anthropic API Key
                  </label>
                  <input
                    type="password"
                    id="anthropicApiKey"
                    value={anthropicApiKey}
                    onChange={(e) => setAnthropicApiKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md 
                           text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Required for Anthropic Claude models
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="mistralApiKey"
                    className="block text-sm font-medium text-gray-400 mb-1"
                  >
                    Mistral API Key
                  </label>
                  <input
                    type="password"
                    id="mistralApiKey"
                    value={mistralApiKey}
                    onChange={(e) => setMistralApiKey(e.target.value)}
                    placeholder="..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md 
                           text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Required for Mistral models
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="openrouterApiKey"
                    className="block text-sm font-medium text-gray-400 mb-1"
                  >
                    OpenRouter API Key
                  </label>
                  <input
                    type="password"
                    id="openrouterApiKey"
                    value={openrouterApiKey}
                    onChange={(e) => setOpenrouterApiKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md 
                           text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Required for OpenRouter models (access to 200+ models)
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="geminiApiKey"
                    className="block text-sm font-medium text-gray-400 mb-1"
                  >
                    Gemini API Key
                  </label>
                  <input
                    type="password"
                    id="geminiApiKey"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AI..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md 
                           text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Required for Google Gemini models
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="selectedModel"
                    className="block text-sm font-medium text-gray-400 mb-1"
                  >
                    Default Model
                  </label>
                  <select
                    id="selectedModel"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md 
                           text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {Object.entries(modelsByProvider).map(
                      ([providerName, models]) => (
                        <optgroup key={providerName} label={providerName}>
                          {models.map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.name}{' '}
                              {model.description
                                ? `- ${model.description}`
                                : ''}
                            </option>
                          ))}
                        </optgroup>
                      )
                    )}
                  </select>
                  <p className="mt-1 text-xs text-gray-400">
                    Select the default model to use with the extension
                  </p>
                </div>
              </div>

              <div>
                <div className="flex flex-row items-center justify-between">
                  <label
                    htmlFor="allow_reduce_content"
                    className="block text-sm font-medium text-gray-400 mb-1"
                  >
                    Allow content reduction
                  </label>
                  <input
                    type="checkbox"
                    id="allow_reduce_content"
                    checked={allow_reduce_content}
                    onChange={(e) => setAllowReduceContent(e.target.checked)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md 
                           text-gray-100 focus:outline-none basis-0"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Use a context reduction strategy to reduce token usage
                  (requires OpenAI API key)
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-300 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {savedMessage && (
              <div className="bg-green-900/30 border border-green-800 text-green-300 p-3 rounded-md text-sm">
                {savedMessage}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-orange-600 
                       rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                       focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 mt-6 border-t border-gray-800">
          <p className="text-xs text-gray-400 text-center">
            ColabAI is an open-source extension that provides AI assistance for
            Google Colab.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Popup;
