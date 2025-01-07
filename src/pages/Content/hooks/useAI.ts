import { useState, useEffect, useCallback, useRef } from "react";
import { acceptChange, applyOperation, rejectChange, requestContent } from '../notebookUpdater';
import { ErrorType, AIError } from "../../../../src/utils/errors";
import { usePendingOperations as usePendingOperations } from "./usePendingOperations";
import { useGenerationState } from "./useGenerationState";
import { useMessages } from "./useMessages";
import { useAIError } from "./useAIError";
import { useMessageListener } from "./useMessageListener";
import { Operation, Pending } from "../../../../src/utils/operations";

export const useAI = (openSubscriptionWindow: () => void, setPrompt: (prompt: string) => void, actionTextAreaRef: any, authState: any) => {

    const { generationState, dispatch } = useGenerationState();
    const messageManager = useMessages();
    const {pendingOperations, setPendingOperations, acceptOperation, rejectOperation, acceptAllOperations, rejectAllOperations} = usePendingOperations(() => {
        dispatch({ type: 'finish_update_notebook' });
    });
    
    const { handleAIError } = useAIError(openSubscriptionWindow, (error) => {
        
        messageManager.addErrorMessage(error.message, error.action, error.actionText);
        
        dispatch({ type: 'error', payload: error.message });
    });
    
    useMessageListener( 
        // Handle text content
        (text: string) => {
            messageManager.setCurrentMessage(text);
            dispatch({ type: 'finish_update_notebook' });
        },
        // Handle operations
        (operation: Operation) => {
            const id = applyOperation(operation);
            dispatch({ type: 'start_update_notebook' });
            return id;
        },
        // Handle messages remaining
        (remaining: number) => {
            messageManager.setMessagesRemaining(remaining);
        },
        // Handle done generating
        (pendingOperations: Map<string, Pending<Operation>>) => {
            dispatch({ type: 'finish_generation' });
            setPendingOperations(pendingOperations);

            if (pendingOperations.size > 0) {
                dispatch({ type: 'start_diffing' });
            }
        }, handleAIError);

    const generateAndInsertContent = async (prompt: string, model: string) => {
        if (!prompt.trim()) return;

        dispatch({ type: 'start_generation' });

        try {
            // Clear the input after starting generation
            actionTextAreaRef.current?.clear();
            setPrompt('');

            const content = await requestContent();

            messageManager.addMessage({ type: 'user', content: prompt });
            messageManager.addMessage({ type: 'ai', content: '' });

            chrome.runtime.sendMessage(
                { action: "generateAI", prompt: prompt, content: content, model: model, plan: authState.subscriptionPlan }
            );

        } catch (error) {
            console.error('Error generating content:', error);
            dispatch({ type: 'error', payload: 'Failed to generate content. Please try again.' });
        }
    };

    useEffect(() => {
        if (messageManager.messages.length > 0) {
            scrollToBottom();
        }
    }, [messageManager.messages]);

    function restartAI() {
        chrome.runtime.sendMessage({ action: "restartAI" });
        messageManager.resetMessages();
    }

    return {
        generationState,
        messageManager,
        pendingOperations,
        acceptOperation,
        rejectOperation,
        acceptAllOperations,
        rejectAllOperations,
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