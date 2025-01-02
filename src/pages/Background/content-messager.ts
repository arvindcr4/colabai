import { type AIError } from '../../../src/utils/errors';
import { Operation, Pending } from "../../utils/operations";


export const sendError = (error: AIError) => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id!, {
            action: 'ai_error',
            error
        });
    });
};

export const sendTextContent = (text: string) => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id!, {
            action: 'ai_text_content',
            content: text
        });
    });
};

// Send operation and return cell id
export async function sendOperation(operation: Operation) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tabs[0].id!, {
        action: 'ai_operation',
        operation
    });

    return response.data.id;
};

export const sendMessagesRemaining = (remaining: number) => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id!, {
            action: 'ai_messages_remaining',
            messagesRemaining: remaining
        });
    });
};

export const doneGenerating = (pendingOperations: Map<string, Pending<Operation>>) => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id!, {
            action: 'ai_done_generating',
            pendingOperations: [...pendingOperations.entries()]
        });
    });
};