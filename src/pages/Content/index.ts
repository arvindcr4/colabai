import App from './App';
import React from 'react';
import { createRoot } from 'react-dom/client';

console.log('Content script works!');
console.log('Must reload extension for modifications to take effect.');

if (document.readyState !== 'loading') {
    console.log('document is already ready, just execute code here');
    waitForNotebook();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        waitForNotebook();
    });
}

function waitForNotebook() {
    const observer = new MutationObserver((mutations, obs) => {
        const notebook = document.querySelector('.notebook-horizontal');
        if (notebook) {
            console.log('Notebook:', notebook);
            obs.disconnect();
            init(notebook);
        }
    });

    observer.observe(document, {
        childList: true,
        subtree: true
    });
}

function init(notebook: Element) {
    const container = document.createElement('div');
    container.id = 'colab-assistant-root';
    container.style.display = 'flex';
    notebook.appendChild(container as Node);

    const root = createRoot(container!); // createRoot(container!) if you use TypeScript
    root.render(React.createElement(App));
}