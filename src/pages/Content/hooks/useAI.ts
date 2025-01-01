import { useState, useEffect, useCallback, useRef } from "react";
import { applyOperation, requestContent } from '../notebookUpdater';
import { ErrorType, AIError } from "../../../../src/utils/errors";
import { useStreamingState, StreamingState } from "./useStreamingState";
import { usePendingOperations as usePendingOperations } from "./usePendingOperations";
import { useGenerationState } from "./useGenerationState";
import { useMessages } from "./useMessages";
import { useAIError } from "./useAIError";

export const useAI = (openSubscriptionWindow: () => void, setPrompt: (prompt: string) => void, actionTextAreaRef: any, authState: any) => {

    const { generationState, dispatch } = useGenerationState();
    const messageManager = useMessages();
    const {streamingState, updateStreamingContent, resetStreamingState} = useStreamingState();
    const {pendingOperations, setPendingOperations, acceptAllChanges, rejectAllChanges} = usePendingOperations();

    const { handleAIError } = useAIError(openSubscriptionWindow, (error) => {
        
        messageManager.addErrorMessage(error.message, error.action, error.actionText);

        dispatch({ type: 'error', payload: error.message });
    });


    // Memoize streamingState.isCodeBlock to prevent unnecessary re-renders
    const isCodeBlock = streamingState.isCodeBlock;
    
    const messageListener = useCallback((message: any) => {
        if (message.action === 'streamed_response') {
            updateStreamingContent(
                message.content, 
                message.done, 
                messageManager.setCurrentMessage
            );

            // Use ref for isCodeBlock to avoid dependency
            dispatch({ 
                type: isCodeBlock ? 'start_update_notebook' : 'finish_update_notebook' 
            });
            
            if (!isCodeBlock) {
                scrollToBottom();
            }
            
            if (message.done) {
                dispatch({ type: 'finish_generation' });
            }
        } else if (message.action === 'messages_remaining') {
            const remaining = message.messagesRemaining;
            if (remaining <= 5) {
                messageManager.setMessagesRemaining(remaining);
            } else {
                messageManager.setMessagesRemaining(null);
            }
        } else if (message.action === 'ai_error') {
            handleAIError(message.error as AIError);
        }
    }, [updateStreamingContent, isCodeBlock, messageManager.setCurrentMessage, messageManager.setMessagesRemaining, dispatch, scrollToBottom, handleAIError]);

    // Effect to handle pending operations when streaming state changes
    useEffect(() => {
        if (streamingState.appliedOperations.size > 0) {

            setPendingOperations(streamingState.appliedOperations);
            dispatch({ type: 'start_diffing' });

            // Listen for diff completion
            const diffListener = (event: any) => {
                if (event.detail.id === 'diff_complete') {
                    dispatch({ type: 'finish_diffing' });
                    document.removeEventListener('diff_complete', diffListener);
                }
            };
            document.addEventListener('diff_complete', diffListener);
        }
    }, [streamingState.appliedOperations]);

    useEffect(() => {

        chrome.runtime.onMessage.addListener(messageListener);

        // Cleanup function to remove the listener
        return () => {
            chrome.runtime.onMessage.removeListener(messageListener);
        };
    }, [messageListener]);

    const generateAndInsertContent = async (prompt: string, model: string) => {
        if (!prompt.trim()) return;

        dispatch({ type: 'start_generation' });

        try {
            // Clear the input after starting generation
            actionTextAreaRef.current?.clear();
            setPrompt('');

            const content = await requestContent();

            resetStreamingState(content);

            messageManager.addMessage({ type: 'user', content: prompt });
            messageManager.addMessage({ type: 'ai', content: '' });

            scrollToBottom();

            chrome.runtime.sendMessage(
                { action: "generateAI", prompt: prompt, content: content, model: model, plan: authState.subscriptionPlan }
            );

        } catch (error) {
            console.error('Error generating content:', error);
            dispatch({ type: 'error', payload: 'Failed to generate content. Please try again.' });
        }
    };

    
    function restartAI() {
        chrome.runtime.sendMessage({ action: "restartAI" });
        messageManager.resetMessages();
    }

    return {
        generationState,
        messageManager,
        pendingOperations,
        acceptAllChanges,
        rejectAllChanges,
        generateAndInsertContent,
        restartAI
    };
}


const scrollToBottom = () => {
    const messageContainer = document.getElementById('message-container'); // Replace with your actual container ID
    if (messageContainer) {
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }
};