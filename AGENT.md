# ColabAI Chrome Extension - Agent Guidelines

## Build/Test/Lint Commands
- **Build**: `npm run build` or `pnpm build` - Builds extension to `build/` folder
- **Development**: `npm start` or `pnpm start` - Starts webpack dev server with hot reload
- **Tests**: `npm test` or `pnpm test` - Runs Jest tests with jsdom environment
- **Test Watch**: `npm run test:watch` - Runs tests in watch mode
- **Test Single File**: `npm test -- <test-file-path>` - Run specific test file
- **Format**: `npm run prettier` - Format all JS/TS/CSS/MD files with Prettier
- **Lint**: Uses ESLint with react-app config (extends from package.json scripts if needed)

## Architecture & Structure
- **Chrome Extension**: Popup + Content Script + Background Service Worker architecture
- **Key Directories**: `src/pages/Popup` (settings UI), `src/pages/Content` (Colab integration), `src/pages/Background` (API handling)
- **AI Integration**: Multi-provider support (OpenAI, DeepSeek, Anthropic, Mistral, OpenRouter) with 200+ models
- **Build Output**: Webpack bundles to `build/` directory with manifest.json
- **Tech Stack**: React 18 + TypeScript + TailwindCSS + Jest testing

## Code Style & Conventions
- **Prettier**: Single quotes, trailing commas ES5, arrow parens always
- **TypeScript**: Strict mode enabled, JSX react mode, path aliases with `@/*`
- **Import Style**: Use `@/` prefix for local imports, organize by external first then local
- **Components**: Functional React components with TypeScript interfaces
- **File Extensions**: `.tsx` for React components, `.ts` for utilities, `.test.ts` for tests
- **CSS**: TailwindCSS classes, avoid inline styles, use CSS modules for component-specific styles
