import { type AIError } from '../../../src/utils/errors';
import { Operation, Pending } from "../../utils/operations";
import { getActiveConversationTab, setActiveConversationTab } from './conversation-manager';
import { ErrorType } from '../../utils/errors';

const sendMessageToTab = async (message: any) => {
    let tabId = getActiveConversationTab();
    
    if (!tabId) {
        try {
            // If no active conversation, get the current active tab
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs.length > 0 && tabs[0].id) {
                tabId = tabs[0].id;
                setActiveConversationTab(tabId);
            }
        } catch (error) {
            if (error instanceof Error && error.message === 'Another tab is currently generating content') {
                sendError({
                    type: ErrorType.GENERATION_IN_PROGRESS,
                    message: 'Please wait for the current generation to complete before starting a new one.'
                });
                return;
            }
            throw error;
        }
    }

    if (tabId) {
        try {
            return await chrome.tabs.sendMessage(tabId, message);
        } catch (error) {
            console.error('Error sending message to tab:', error);
        }
    }
};

export const sendError = (error: AIError) => {
    sendMessageToTab({
        action: 'ai_error',
        error
    });
};

export const sendTextContent = (text: string) => {
    sendMessageToTab({
        action: 'ai_text_content',
        content: text
    });
};

// Send operation and return cell id
export async function sendOperation(operation: Operation) {
    const response = await sendMessageToTab({
        action: 'ai_operation',
        operation
    });

    return response?.data?.id;
};

export const sendMessagesRemaining = (remaining: number) => {
    sendMessageToTab({
        action: 'ai_messages_remaining',
        messagesRemaining: remaining
    });
};

export const doneGenerating = (pendingOperations: Map<string, Pending<Operation>>) => {
    sendMessageToTab({
        action: 'ai_done_generating',
        pendingOperations: [...pendingOperations.entries()]
    });
};