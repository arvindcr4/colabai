import { useRef } from "react";

export function useScrollToBottom() {
    const messageContainer = useRef<HTMLDivElement | null>(null);
    const scrollToBottom = () => {
        if (!messageContainer.current)
            messageContainer.current = document.getElementById('message-container') as HTMLDivElement;

        messageContainer.current.scrollTop = messageContainer.current.scrollHeight;
    };

    return { scrollToBottom };
}