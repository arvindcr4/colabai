import React, { useEffect, useState } from 'react'
import { parseContent } from './parser'

const App = () => {
    const [isOpen, setIsOpen] = useState(false)

    const toggleIsOpen = () => {
        setIsOpen(!isOpen)
    }

    useEffect(() => {
        console.log('Gimme: App.tsx')
        setIsOpen(true)

        // Inject the page script
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('page-script.js');
        document.body.appendChild(script);

        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === "contentScriptReady") {
                sendResponse({ ready: true });
            } else if (request.action === "applyOperations") {
                applyOperations(request.content);
                sendResponse({ success: true });
            } else if (request.action === "getContent") {
                requestContent(content => {
                    sendResponse({ success: true, data: content });
                });
            }
            return true;  // Indicates we will send a response asynchronously
        });
    }, [])

    return (
        <div className="p-4 space-y-4 space-x-5">
            <div className="flex items-center space-x-2">
                <div className="bg-blue-50 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                </div>
                <h1 className="text-lg font-semibold text-gray-900">Colab AI Assistant</h1>
            </div>

            <div className="space-y-2">
                <textarea id="prompt" placeholder="Enter your prompt here..."
                    className="w-full h-32 px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none bg-gray-50 focus:bg-white"></textarea>
            </div>

            <div className="space-y-2">
                <select id="model"
                    className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 cursor-pointer">
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                </select>
            </div>

            <div className="flex space-x-2">
                <button onClick={() => { console.log('test') }} id="generate"
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ display: 'inline-block' }}
                        xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 5l7 7-7 7"></path>
                    </svg>
                    Send
                </button>
            </div>
        </div>
    )
}

function applyOperations(content: string) {
    const operations = parseContent(content);

    for (let i = 0; i < operations.length; i++) {
        setTimeout(() => {
            const operation = operations[i];
            if (operation.type === 'create') {
                insertCell(operation.content, operation.cellType, operation.position);
            } else if (operation.type === 'edit') {
                updateCell(operation.cellId, operation.content);
            } else if (operation.type === 'delete') {
                deleteCell(operation.cellId);
            } else {
                console.error('Invalid operation type:', operation.type);
            }
        }, 1000 * i);  // Delay to allow for cell creation
    }
}

function insertCell(content, type, position) {
    const atIndex = getCellIndexFromRelativePosition(position);
    const notebook = document.querySelector('colab-shaded-scroller');
    const lastCell = notebook.querySelector(`.notebook-cell-list > :nth-child(${atIndex})`);
    const addButtonGroup = atIndex === 0 ? notebook.querySelector('.add-cell') : lastCell.querySelector('.add-cell');

    var event = new MouseEvent('mouseenter', {
        'view': window,
        'bubbles': true,
        'cancelable': true
    });

    addButtonGroup.dispatchEvent(event); // Hover over the add cell button to make the buttons visible

    const addButton = addButtonGroup.querySelector(type === 'code' ? '.add-code' : '.add-text') as HTMLElement;
    addButton.click();

    // get the newly created cell
    const newCell = notebook.querySelector('.notebook-cell-list > :nth-child(' + (atIndex + 1) + ')');
    const id = newCell.getAttribute('id');

    // Use a custom event to pass data to the page context
    setTimeout(() => {
        const customEvent = new CustomEvent('setMonacoValue', {
            detail: { id: id, content: content, type: type }
        });
        document.dispatchEvent(customEvent);

    }, 500);  // Increased timeout to allow for cell creation
}

function updateCell(id, newContent) {
    const customEvent = new CustomEvent('setMonacoValue', {
        detail: { id: id, content: newContent }
    });
    document.dispatchEvent(customEvent);
}

function deleteCell(id) {
    const customEvent = new CustomEvent('deleteCell', { detail: { id: id } });
    document.dispatchEvent(customEvent);
}

function requestContent(callback) {
    function handleContentEvent(event) {
        document.removeEventListener('contentValue', handleContentEvent);
        callback(event.detail.content);
    }

    document.addEventListener('contentValue', handleContentEvent);

    const customEvent = new CustomEvent('getContent');
    document.dispatchEvent(customEvent);
}

function getCellIndexFromRelativePosition(position) {
    const notebook = document.querySelector('colab-shaded-scroller');
    const cells = notebook.querySelectorAll('.cell');

    if (position === 'top') {
        return 0;
    } else if (position === 'bottom') {
        return cells.length;
    } else if (position.startsWith('after:')) {
        const id = position.split(':')[1];
        const index = Array.from(cells).findIndex(cell => cell.getAttribute('id') === id);
        return index + 1;
    } else if (position.startsWith('before:')) {
        const id = position.split(':')[1];
        const index = Array.from(cells).findIndex(cell => cell.getAttribute('id') === id);
        return index;
    } else {
        return null;
    }
}


export default App
