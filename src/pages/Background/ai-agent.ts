import { NotebookChangeTracker } from './change-tracker';
import { NotebookCell } from '../../utils/types';
import { ErrorType, AIServiceError } from '../../utils/errors';
import CodeSimplifier from './code-simplifier';
import { updateStreamingContent, resetStreamingState } from './Parsing/streaming-state';
import { sendError } from './content-messager';
import { clearActiveConversationTab } from './conversation-manager';
import { ModelFactory } from '../../utils/models/model-factory';
import { Message } from '../../utils/models/model-interface';
import { getModelById, ModelProvider } from '../../utils/models/types';
import { system_prompt, context_enhancer_prompt } from './prompts';

let notebookTracker: NotebookChangeTracker;
const changeLogs: string[] = [];
const prompts: string[] = [];
const responses: string[] = [];

function trackNotebookChanges(currentCells: NotebookCell[]) {
    const tracker = notebookTracker || new NotebookChangeTracker();
    notebookTracker = tracker;

    return tracker.updateState(currentCells);
}


export async function generateAIContent(prompt: string, content: NotebookCell[], modelId = "gpt-4o-mini") {
    try {
        trackNotebookChanges(content);
        resetStreamingState(content);

        // Get current notebook state with full content for referenced cells
        let notebookState = notebookTracker.getLastState([], false);

        const { allow_reduce_content } = await chrome.storage.local.get('allow_reduce_content');

        const shouldReduceContent = allow_reduce_content && notebookState.length > 100_000; // Simplified content reduction decision

        console.log('Should reduce content:', shouldReduceContent);

        if (shouldReduceContent) {
            const requiredCellIds = await getRequiredCellIds(prompt, modelId);

            // Extract cell IDs from focused and surrounding cell tags
            const focusedCellRegex = /(cell-\S+)/g;

            prompt.match(focusedCellRegex)?.forEach((cellId: string) => {
                if (!requiredCellIds.includes(cellId)) {
                    requiredCellIds.push(cellId);
                }
            });

            notebookState = notebookTracker.getLastState(requiredCellIds, true);
        }

        if (prompts.length > 3) {
            prompts.shift();
        }
        prompts.push(prompt);

        const messages: Message[] = [];

        // Add system prompt
        messages.push({ role: 'system', content: system_prompt });

        // Add previous conversation context (up to last 3 interactions)
        for (let i = 0; i < prompts.length-1; i++) {
            if(prompts[i])
                messages.push({ role: 'user', content: prompts[i] });
            
            if(responses[i])
                messages.push({ role: 'assistant', content: responses[i] });
        }
        
        // Add current prompt with notebook state
        messages.push({ 
            role: 'user', 
            content: `This is the current notebook state for reference: <notebook_state>${notebookState}</notebook_state>. ${prompt}`
        });
    
        // Get appropriate API key and model information, then stream the response
        await streamModelResponse(messages, modelId);

    } catch (error: any) {
        clearActiveConversationTab(); // Clear the lock if there's an error

        // Convert network errors to our error type
        if (error instanceof TypeError && error.message.includes('network')) {
            sendError({
                type: ErrorType.NETWORK,
                message: 'Network connection error',
                details: error
            });
        } 

        if (error.type && Object.values(ErrorType).includes(error.type)) {
            sendError(error);
        }

        throw error;
    }
}

async function getRequiredCellIds(prompt: string, modelId = "gpt-4o-mini"): Promise<string[]> {
    try {
        const notebookState = notebookTracker.getLastState([], true);
        
        const messages: Message[] = [
            { role: 'system', content: context_enhancer_prompt },
            { role: 'user', content: `Current notebook state: ${notebookState}\nPrompt: ${prompt}` }
        ];
        
        const modelResponse = await callModel(messages, modelId);
        
        try {
            // Parse the response as JSON to get cell IDs
            const ids = JSON.parse(modelResponse);
            console.log('Required cell IDs:', ids);
            
            if (Array.isArray(ids) && ids.length > 0) {
                return ids;
            }
        } catch (parseError) {
            console.error('Error parsing cell IDs from response:', parseError);
            // Try to extract cell IDs from the text using regex
            const cellIdRegex = /(cell-\S+)/g;
            const matches = modelResponse.match(cellIdRegex);
            if (matches && matches.length > 0) {
                return matches;
            }
        }
    } catch (error: any) {
        console.error('Error getting required cell IDs:', error);
    }

    return [];
}

async function callModel(messages: Message[], modelId: string): Promise<string> {
    const modelInfo = getModelById(modelId);
    if (!modelInfo) {
        throw new AIServiceError({
            type: ErrorType.CONFIGURATION,
            message: `Unknown model ID: ${modelId}. Please select a valid model in the settings.`
        });
    }
    
    // Get appropriate API key based on the model provider
    const provider = modelInfo.provider;
    const storageKey = provider === ModelProvider.OPENAI ? 'openai_api_key' : 'deepseek_api_key';
    
    const result = await chrome.storage.local.get(storageKey);
    const apiKey = result[storageKey];
    
    if (!apiKey) {
        throw new AIServiceError({
            type: ErrorType.CONFIGURATION,
            message: `API key for ${provider} is not configured. Please set it in the extension options.`
        });
    }
    
    // Create model instance using the factory
    const model = ModelFactory.createModelFromId(modelId, apiKey, 0.2);
    
    try {
        // Call the model's non-streaming method
        return await model.generate(messages);
    } catch (error: any) {
        console.error(`${provider} API error:`, error);
        throw error;
    }
}

async function streamModelResponse(messages: Message[], modelId: string): Promise<void> {
    const modelInfo = getModelById(modelId);
    if (!modelInfo) {
        throw new AIServiceError({
            type: ErrorType.CONFIGURATION,
            message: `Unknown model ID: ${modelId}. Please select a valid model in the settings.`
        });
    }
    
    // Get appropriate API key based on the model provider
    const provider = modelInfo.provider;
    const storageKey = provider === ModelProvider.OPENAI ? 'openai_api_key' : 'deepseek_api_key';
    
    const result = await chrome.storage.local.get(storageKey);
    const apiKey = result[storageKey];
    
    if (!apiKey) {
        throw new AIServiceError({
            type: ErrorType.CONFIGURATION,
            message: `API key for ${provider} is not configured. Please set it in the extension options.`
        });
    }
    
    // Create model instance using the factory
    const model = ModelFactory.createModelFromId(modelId, apiKey, 0.7);
    
    try {
        let fullResponse = '';
        
        // Use the streaming generator pattern
        const responseStream = model.generateStream(messages);
        
        for await (const chunk of responseStream) {
            if (chunk.content) {
                // Process the chunk and update streaming content
                await updateStreamingContent(chunk.content, false);
                fullResponse += chunk.content;
            }
            
            if (chunk.isComplete) {
                break;
            }
        }
        
        // Mark streaming as done
        await updateStreamingContent('', true);
        
        // Save the full response for conversation history
        responses.push(fullResponse);
        
        console.log('Response:', fullResponse);
    } catch (error: any) {
        console.error(`${provider} streaming error:`, error);
        throw error;
    }
}

export async function restartAI() {
    notebookTracker = new NotebookChangeTracker();
    changeLogs.length = 0;
    prompts.length = 0;
    responses.length = 0;
    clearActiveConversationTab();
}