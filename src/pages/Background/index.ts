import { generateAIContent, restartAI } from './ai-agent';

console.log("Background script initialized");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Background received message:", request);
    const { action, type } = request;

    if (action === "ping") {
        console.log("Received ping");
        sendResponse({ success: true });
        return true;
    }

    switch (action) {
        case 'generateAI':
            console.log("Generating AI content...");
            const model = request.model || 'gpt-4o-mini';
            
            generateAIContent(request.prompt, request.content, model)
                .then(() => {
                    sendResponse({ success: true });
                })
                .catch((error) => {
                    console.error('Error generating AI content:', error);
                    sendResponse({ success: false, error });
                });
            return true;

        case 'restartAI':
            console.log("Restarting AI...");
            restartAI();
            sendResponse({ success: true });
            return true;

        case 'OPEN_POPUP':
            try {
                const { popupUrl, width, height, left, top } = request.payload || {};
                chrome.windows.create({
                    url: popupUrl,
                    type: 'popup',
                    width: width || 350,
                    height: height || 500,
                    left: left || 100,
                    top: top || 100
                });
                sendResponse({ success: true });
            } catch (error) {
                console.error('Error opening popup:', error);
                sendResponse({ success: false, error });
            }
            return true;

        default:
            console.log("Unhandled action:", action);
            sendResponse({ success: false, error: `Invalid action: ${action}` });
            return true;
    }
});

export { }