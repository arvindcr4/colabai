import { useState } from 'react';
import { Message } from "../Message";

export const useMessages = () => {
    const [messages, setMessages] = useState(initialMessages);
    const [messagesRemaining, setMessagesRemaining] = useState<number | null>(null);
  
    const addMessage = (message: Message) => {
      setMessages(prev => [...prev, message]);
    };

    const setCurrentMessage = (message: ((prevCurrent: string) => string) | string) => {
        setMessages((previousMessages) => {
            const newMessage = typeof message === 'function' ? message(previousMessages[previousMessages.length - 1]?.content || '') : message;
            const updatedMessages = [...previousMessages];
            updatedMessages[updatedMessages.length - 1] = { ...updatedMessages[updatedMessages.length - 1], content: newMessage };
            return updatedMessages;
        });
    };

    const resetMessages = () => {
        setMessages(initialMessages);
    };

    const addErrorMessage = (errorMessage: string, action?: () => void, actionText?: string) => {
        setMessages(prev => [
            ...(prev[-1]?.type === 'ai' ? prev.slice(0, -1) : prev),
            {
                type: 'error',
                content: errorMessage,
                action,
                actionText,
                timestamp: new Date().toISOString()
            }
        ] as Message[]);
    }
  
    return {
        messages,
        messagesRemaining,
        addMessage,
        addErrorMessage,
        setCurrentMessage,
        resetMessages,
        setMessagesRemaining
    };
  };

  
const initialMessages = [
    {
        type: 'ai',
        content: `Welcome to the ColabAI Assistant! I can help you generate content for your notebook. Just type your prompt and I'll take care of the rest.`
    },
    // {
    //     type: 'user',
    //     content: 'Generate content about...'
    // },
    // {
    //     type: 'ai',
    //     content: `Sure! Here is some content about...
    //     @START_CODE
    //     Let me know if you need any more help!`
    // }
] as Message[];