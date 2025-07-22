# ColabAI: A Better AI Assistant for Google Colab

<img src="src/assets/img/icon128.png" width="64"/>

## Overview

ColabAI is an open-source Chrome extension that provides AI-powered assistance for Google Colab notebooks. The extension helps users with their Python code, data analysis, machine learning projects, and other tasks directly within the Colab interface.

You can find the extension on the Chrome Web Store: [ColabAI](https://chromewebstore.google.com/detail/lmlnapmafcnbkhnhjmieckaceddajbkm?utm_source=item-share-cb)

## Features

- **AI-Powered Code Assistance**: Get suggestions for code improvements, bug fixes, and optimizations.
- **Interactive Chat Interface**: Ask questions about your code and get real-time responses.
- **Context-Aware Suggestions**: The AI understands your notebook context to provide relevant assistance.
- **Multiple AI Providers**: Support for OpenAI, DeepSeek, Anthropic Claude, Mistral, and OpenRouter with access to 200+ models.
- **Flexible Model Selection**: Choose from a wide range of models including GPT-4o, Claude 3.5 Sonnet, DeepSeek R1, Mistral Large, Llama, Gemini, and many more.
- **User-Controlled API Keys**: Use your own API keys for complete control over usage and costs.
- **Context Reduction**: Optional intelligent context reduction to optimize token usage and reduce costs.

## Getting Started

### Installation

1. Clone this repository:

   ```
   git clone https://github.com/yourusername/colabai.git
   cd colabai
   ```

2. Install dependencies:

   ```
   pnpm install
   ```

3. Build the extension:

   ```
   pnpm build
   ```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" at the top right
   - Click "Load unpacked" and select the `build` folder from this project

### Configuration

1. After installing the extension, click on the ColabAI icon in your Chrome toolbar.
2. Configure your API keys for the providers you want to use (see [API Keys](#api-keys) section below).
3. Select your preferred model from the dropdown.
4. Optionally enable context reduction to optimize token usage.
5. Your settings will be saved locally and used for all AI requests.

## API Keys

ColabAI supports multiple AI providers. You only need to configure API keys for the providers you want to use:

### OpenAI
- **Models**: GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-4, GPT-3.5 Turbo
- **API Key Format**: `sk-...`
- **Get API Key**: [OpenAI Platform](https://platform.openai.com/account/api-keys)
- **Required for**: OpenAI models and context reduction feature

### DeepSeek
- **Models**: DeepSeek R1, DeepSeek Chat, DeepSeek Coder
- **API Key Format**: `sk-...`
- **Get API Key**: [DeepSeek Platform](https://platform.deepseek.com/)
- **Note**: Excellent for coding tasks and reasoning

### Anthropic
- **Models**: Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku
- **API Key Format**: `sk-ant-...`
- **Get API Key**: [Anthropic Console](https://console.anthropic.com/)
- **Note**: Excellent for analysis, writing, and complex reasoning

### Mistral
- **Models**: Mistral Large, Mistral Small, Pixtral (multimodal), Mixtral models
- **API Key Format**: Various formats
- **Get API Key**: [Mistral Platform](https://console.mistral.ai/)
- **Note**: Strong performance with competitive pricing

### OpenRouter
- **Models**: 200+ models including Llama, Gemini, Claude, GPT, and many others
- **API Key Format**: `sk-or-v1-...`
- **Get API Key**: [OpenRouter](https://openrouter.ai/keys)
- **Note**: Access to the largest variety of models through a single API
- **Popular models available**:
  - Meta Llama 3.3 70B, Llama 3.2 Vision models
  - Google Gemini Pro/Flash 1.5
  - Anthropic Claude models
  - OpenAI GPT models
  - Cohere Command R+
  - Qwen 2.5 72B
  - X.AI Grok-2
  - Many more open-source and commercial models

### Environment Variables (Optional)

For development purposes, you can also set API keys as environment variables:

```bash
export OPENAI_API_KEY="your-openai-key"
export DEEPSEEK_API_KEY="your-deepseek-key"
export ANTHROPIC_API_KEY="your-anthropic-key"
export MISTRAL_API_KEY="your-mistral-key"
export OPENROUTER_API_KEY="your-openrouter-key"
```

**Note**: Environment variables are only used during development. In the browser extension, API keys are configured through the popup interface.

## Usage

1. Open any Google Colab notebook.
2. Click the ColabAI icon in the notebook interface or use the keyboard shortcut to open the AI panel.
3. Type your question or request help with specific code.
4. The AI will analyze your notebook context and provide relevant assistance.

### Example Use Cases

**Code Debugging:**
```
"This code is giving me a KeyError. Can you help me fix it?"
```

**Code Optimization:**
```
"Can you make this pandas operation more efficient?"
```

**Explanation:**
```
"Explain what this machine learning model is doing step by step"
```

**Code Generation:**
```
"Generate a function to plot a confusion matrix with seaborn"
```

**Data Analysis:**
```
"What insights can you find in this dataset? Suggest some visualizations"
```

**Library Recommendations:**
```
"What's the best library for time series forecasting in Python?"
```

## Technical Details

### Architecture

The extension consists of several components:

- **Popup**: Settings interface for API keys and model selection across all providers.
- **Content Script**: Injects the AI panel into Google Colab's interface.
- **Background Service Worker**: Handles API calls to multiple AI providers.
- **AI Agent**: Manages context, changes, and conversations.
- **Model Factory**: Dynamically creates the appropriate API client based on the selected model.
- **Provider Models**: Separate implementations for OpenAI, DeepSeek, Anthropic, Mistral, and OpenRouter APIs.

### Privacy & Security

- Your API key is stored locally in Chrome's storage and never sent to any server besides the LLM providers.
- All AI requests are made directly from your browser to the LLM providers using your API key.
- No authentication or user data is collected.

## Development

### Running in Development Mode

```
pnpm start
```

This will start the webpack dev server with hot reloading.

### Building for Production

```
pnpm build
```

### Project Structure

- `src/pages/Background`: Background service worker code
- `src/pages/Content`: Content script for Google Colab integration
- `src/pages/Popup`: Settings page UI
- `src/utils`: Shared utilities

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
