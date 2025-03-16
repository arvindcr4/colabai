import App from './App';
import { createRoot } from 'react-dom/client';
import React from 'react';

if (document.readyState !== 'loading') {
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
            obs.disconnect();
            init(notebook);
        }
    });

    observer.observe(document, {
        childList: true,
        subtree: true
    });
  
    // Set a timeout to stop observing if no Colab notebook is found after 10 seconds
    setTimeout(() => {
        observer.disconnect();
    }, 10000);
}

function init(notebook: Element) {
    const container = document.createElement('div');
    container.id = 'colab-assistant-root';
    container.style.display = 'flex';
    notebook.appendChild(container as Node);

    const root = createRoot(container);
    root.render(
        <App />
    );
}
