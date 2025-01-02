import { useEffect, useCallback } from "react";
import { CreateOperation, DeleteOperation, EditOperation, DiffOperation, Operation, Pending } from "../../../utils/operations";
import { AIError } from "../../../../src/utils/errors";

export const useMessageListener = (
    handleTextContent: (text: string) => void, 
    handleOperation: (operation: Operation) => string | null,
    handleMessagesRemaining: (messagesRemaining: number) => void,
    handleDoneGenerating: (pendingOperations: Map<string, Pending<Operation>>) => void,
    handleAIError: (error: AIError) => void,
    ) => {

    const messageListener = useCallback((message: any, sender: any, sendResponse: any) => {

        if (message.action === 'ai_text_content') {
            handleTextContent(message.content);
        } else if (message.action === 'ai_operation') {
            const id = handleOperation(message.operation);
            sendResponse({ success: true, data: { id } });
        } else if (message.action === 'ai_error') {
            handleAIError(message.error);
        } else if (message.action === 'ai_messages_remaining') {
            handleMessagesRemaining(message.messagesRemaining);
        } else if (message.action === 'ai_done_generating') {
            handleDoneGenerating(new Map(message.pendingOperations));
        }
    }, [handleTextContent, handleOperation, handleAIError, handleMessagesRemaining, handleDoneGenerating]);
    
    useEffect(() => {
        chrome.runtime.onMessage.addListener(messageListener);

        // Cleanup function to remove the listener
        return () => {
            chrome.runtime.onMessage.removeListener(messageListener);
        };
        
    }, [messageListener]);

};