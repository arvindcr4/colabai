# ColabAI: AI Assistant for Google Colab

<img src="src/assets/img/icon128.png" width="64"/>

## Overview

ColabAI is an open-source Chrome extension that provides AI-powered assistance for Google Colab notebooks. The extension helps users with their Python code, data analysis, machine learning projects, and other tasks directly within the Colab interface.

## Features

- **AI-Powered Code Assistance**: Get suggestions for code improvements, bug fixes, and optimizations.
- **Interactive Chat Interface**: Ask questions about your code and get real-time responses.
- **Context-Aware Suggestions**: The AI understands your notebook context to provide relevant assistance.
- **Support for Multiple OpenAI Models**: Choose from different OpenAI models based on your needs.
- **User-Controlled API Keys**: Use your own OpenAI API key for complete control over usage.

## Getting Started

### Installation

1. Clone this repository:

   ```
   git clone https://github.com/yourusername/colabai.git
   cd colabai
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Build the extension:

   ```
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" at the top right
   - Click "Load unpacked" and select the `build` folder from this project

### Configuration

1. After installing the extension, click on the ColabAI icon in your Chrome toolbar.
2. Enter your API keys in the popup.
3. Select your preferred model.
4. Your settings will be saved locally and used for all AI requests.

## Usage

1. Open any Google Colab notebook.
2. Click the ColabAI icon in the notebook interface or use the keyboard shortcut to open the AI panel.
3. Type your question or request help with specific code.
4. The AI will analyze your notebook context and provide relevant assistance.

## Technical Details

### Architecture

The extension consists of several components:

- **Popup**: Settings interface for OpenAI API key and model selection.
- **Content Script**: Injects the AI panel into Google Colab's interface.
- **Background Service Worker**: Handles API calls.
- **AI Agent**: Manages context, changes, and conversations.

### Privacy & Security

- Your API key is stored locally in Chrome's storage and never sent to any server besides the LLM providers.
- All AI requests are made directly from your browser to the LLM providers using your API key.
- No authentication or user data is collected.

## Development

### Running in Development Mode

```
npm start
```

This will start the webpack dev server with hot reloading.

### Building for Production

```
npm run build
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
