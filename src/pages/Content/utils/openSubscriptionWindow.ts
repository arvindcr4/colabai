
export const openSubscriptionWindow = () => {
    const width = 1200;
    const height = 900;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    chrome.runtime.sendMessage({
        action: "OPEN_POPUP",
        payload: {
            popupUrl: chrome.runtime.getURL('subscription.html'),
            width,
            height,
            left: Math.floor(left),
            top: Math.floor(top)
        }
    });
};