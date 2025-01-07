import { NotebookChangeTracker } from './change-tracker';
import { NotebookCell } from '../../utils/types';
import { ErrorType, type AIError } from '../../utils/errors';
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from "@supabase/supabase-js";
import CodeSimplifier from './code-simplifier';
import { ModelType } from '../../../src/utils/types';
import { updateStreamingContent, resetStreamingState } from './Parsing/streaming-state';
import { sendError, sendMessagesRemaining } from './content-messager';
import { clearActiveConversationTab } from './conversation-manager';

let notebookTracker: NotebookChangeTracker;
const changeLogs: string[] = [];
const prompts: string[] = [];
const responses: string[] = [];

function trackNotebookChanges(currentCells: NotebookCell[]) {
    const tracker = notebookTracker || new NotebookChangeTracker();
    notebookTracker = tracker;

    return tracker.updateState(currentCells);
}

export async function generateAIContent(prompt: string, content: NotebookCell[], supabase: any, model = "gpt-4o-mini", plan = 'free') {
    try {
        trackNotebookChanges(content);
        resetStreamingState(content);

        // Get current notebook state with full content for referenced cells
        let notebookState = notebookTracker.getLastState([], false);
        const shouldReduceContent = plan === 'free' ? notebookState.length > 20_000 : notebookState.length > 200_000;

        console.log('Should reduce content:', shouldReduceContent);

        if (shouldReduceContent) {
            const requiredCellIds = await sendToContextEnhancer(supabase, prompt, model);

            // Extract cell IDs from focused and surrounding cell tags
            const focusedCellRegex = /(cell-\S+)/g;

            prompt.match(focusedCellRegex)?.forEach((cellId: string) => {
                if (!requiredCellIds.includes(cellId)) {
                    requiredCellIds.push(cellId);
                }
            });

            notebookState = notebookTracker.getLastState(requiredCellIds, true);
        }

        // Keep only the last 3 interactions to manage context size
        // if (changeLogs.length > 3) {
        //     changeLogs.shift();
        // }
        // changeLogs.push(changeLog);

        if (prompts.length > 3) {
            prompts.shift();
        }
        prompts.push(prompt);

        const messages: { role: string; content: string; }[] = [];

        for (let i = 0; i < prompts.length-1; i++) {
            if(prompts[i])
                messages.push({ role: 'user', content: prompts[i] });
            
            if(responses[i])
                messages.push({ role: 'assistant', content: responses[i] });
        }
        
        messages.push({ 
            role: 'user', 
            content: `This is the current notebook state for reference: <notebook_state>${notebookState}</notebook_state>. ${prompt}`
        });
    
        
        const data = await sendAI(supabase, messages, model);
        await getStreamedResponse(data);

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

async function sendToContextEnhancer(supabase: any, prompt: string, model = "gpt-4o-mini") {
    
    try {
        const requiredCellIds: string[] = [];
        const notebookState = notebookTracker.getLastState();
        
        const data = await sendAI(supabase, [
            { role: 'user', content: `Current notebook state: ${notebookState}
            Prompt: ${prompt}` },
        ], model, true);

        const ids = JSON.parse(data).cellIds;
        console.log('Required cell IDs:', ids);

        if (ids && ids.length > 0) {
            requiredCellIds.push(...ids);
        }

        return requiredCellIds;

    } catch (error: any) {
        // Convert network errors to our error type
        if (error instanceof TypeError && error.message.includes('network')) {
            error = {
                type: ErrorType.NETWORK,
                message: 'Network connection error',
                details: error
            };
        }
        
        sendError(error);
    }

    return [];
}

async function sendAI(supabase: any, messages: { role: string; content: string; }[], model = "gpt-4o-mini", contextEnhancer = false) {
    const { data, error } = await supabase.functions.invoke('ai-agent', {
        body: {
            messages,
            model,
            contextEnhancer
        }
    });

    console.log(`Sent to ${contextEnhancer? "context enhancer" : "AI agent"}:`, messages);

    if (error instanceof FunctionsHttpError) {
        const errorMessage = await error.context.json()
        console.error('Supabase function error:', errorMessage);
        throw errorMessage.error;
    } else if (error instanceof FunctionsRelayError) {
        throw {
            type: ErrorType.SERVER,
            message: 'Error during content streaming',
            details: error
        };
    } else if (error instanceof FunctionsFetchError) {
        throw {
            type: ErrorType.SERVER,
            message: 'Error during content streaming',
            details: error
        };
    }

    return data;
}

async function getStreamedResponse(data: any) {
    const reader = data.body?.getReader();
    const decoder = new TextDecoder("utf-8");
    let done = false;
    let buffer = ''; // Buffer to store incomplete lines
    let response = '';

    if (reader == null) {
        throw {
            type: ErrorType.SERVER,
            message: "Response body is null"
        };
    }

    while (!done) {
        const { value, done: chunkDone } = await reader.read();
        if (value) {
            // Append new chunk to buffer and split by newlines
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            
            // Process all complete lines (keeping the last potentially incomplete line in buffer)
            buffer = lines.pop() || '';
            
            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const data = JSON.parse(line);
                        
                        // Check if this is an error message
                        if (data.error) {
                            throw data.error;
                        }
                        
                        if (data.messages_remaining !== undefined) {
                            sendMessagesRemaining(data.messages_remaining);
                        } else if (data.content !== undefined) {
                            
                            await updateStreamingContent(data.content, data.done);

                            response += data.content;
                        }
                    } catch (error: any) {
                        // If this is a structured error from the server, propagate it
                        if (error.type && Object.values(ErrorType).includes(error.type)) {
                            throw error;
                        }
                        console.error('Error parsing JSON:', error, 'Line:', line);
                        throw {
                            type: ErrorType.SERVER,
                            message: 'Error parsing server response',
                            details: { error, line }
                        };
                    }
                }
            }
        }
        done = chunkDone;

        if (done) {
            console.log('Response:', response);
            responses.push(response);
        }
    }

    // Process any remaining complete line in buffer
    if (buffer.trim()) {
        try {
            const data = JSON.parse(buffer);
            if (data.error) {
                throw data.error;
            }
            if (data.content !== undefined) {
                await updateStreamingContent(data.content, data.done);
            }
        } catch (error) {
            console.error('Error parsing final buffer:', error);
            throw {
                type: ErrorType.SERVER,
                message: 'Error parsing final server response',
                details: { error, buffer }
            };
        }
    }
}

export async function restartAI() {
    notebookTracker = new NotebookChangeTracker();
    changeLogs.length = 0;
    prompts.length = 0;
    responses.length = 0;
    clearActiveConversationTab();
}