// Store the active conversation tab ID
let activeConversationTabId: number | null = null;
let isGenerating = false;

export const setActiveConversationTab = (tabId: number) => {
    if (isGenerating) {
        throw new Error('Another tab is currently generating content');
    }
    activeConversationTabId = tabId;
    isGenerating = true;
};

export const getActiveConversationTab = () => {
    return activeConversationTabId;
};

export const clearActiveConversationTab = () => {
    activeConversationTabId = null;
    isGenerating = false;
};

export const isActivelyGenerating = () => {
    return isGenerating;
};
