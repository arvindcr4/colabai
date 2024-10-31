import React, { useEffect, useState, useRef } from 'react'
import { parseContent } from './parser'
import '../../styles.css';
import { UserCircle } from 'lucide-react';


const [minWidth, maxWidth, defaultWidth] = [200, 500, 350];
const messages = [
    {
        type: 'user',
        content: 'Can you help me understand how to implement a binary search tree?'
    },
    {
        type: 'ai',
        content: 'Of course! A binary search tree is a data structure where each node has at most two children, with all left descendants being less than the current node, and all right descendants being greater. Would you like me to explain the implementation details?'
    }
];

const App = () => {

    const [width, setWidth] = useState(defaultWidth);
    const isResized = useRef(false);
    const overlay = useRef<HTMLDivElement | null>(null);

    useEffect(() => {

        overlay.current = document.createElement('div');
        overlay.current.style.position = 'fixed';
        overlay.current.style.top = '0';
        overlay.current.style.left = '0';
        overlay.current.style.width = '100%';
        overlay.current.style.height = '100%';
        overlay.current.style.cursor = 'col-resize';
        overlay.current.style.zIndex = '9999';
        overlay.current.style.backgroundColor = 'transparent';
        overlay.current.style.display = 'none';

        document.body.appendChild(overlay.current);

        overlay.current.addEventListener("mousemove", (e) => {
            if (!isResized.current) {
                return;
            }

            setWidth((previousWidth) => {
                const newWidth = window.innerWidth - e.pageX;

                const isWidthInRange = newWidth >= minWidth && newWidth <= maxWidth;

                return isWidthInRange ? newWidth : previousWidth;
            });

            e.preventDefault();
            pauseEvent(e);
        });

        overlay.current.addEventListener("mouseup", () => {
            isResized.current = false;
            if (overlay.current)
                overlay.current.style.display = 'none';
        });

        function pauseEvent(e: Event) {
            if (e.stopPropagation) e.stopPropagation();
            if (e.preventDefault) e.preventDefault();
            e.cancelBubble = true;
            e.returnValue = false;
            return false;
        }

    }, [])

    useEffect(() => {

        // Inject the page script
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('pageScript.js');
        document.body.appendChild(script);

        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === "contentScriptReady") {
                sendResponse({ ready: true });
            } else if (request.action === "applyOperations") {
                applyOperations(request.content);
                sendResponse({ success: true });
            } else if (request.action === "getContent") {
                requestContent((content: string) => {
                    sendResponse({ success: true, data: content });
                });
            }
            return true;  // Indicates we will send a response asynchronously
        });
    }, [])

    return (
        <>
            <div
                className="w-2 cursor-col-resize"
                onMouseDown={() => {
                    isResized.current = true;
                    if (overlay.current) {
                        overlay.current.style.display = 'block';
                    }
                }}
            />
            <div className="p-4 space-y-4 shadow-xl bg-gray-900 text-gray-100 flex flex-col justify-between" style={{ width: `${width / 16}rem` }}>
                <div>
                    <div className="flex items-center space-x-2 mb-6">
                        <div className="bg-gray-800 p-2 rounded-lg">
                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" ></path>
                            </svg>
                        </div>
                        <h1 className="text-lg font-semibold text-white"> Colab AI Assistant </h1>
                    </div>

                    {/* Messages Area */}
                    <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                        {messages.map((message, index) => (
                            <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex gap-2 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Avatar */}
                                    <div className={`flex-shrink-0 ${message.type === 'ai' ? 'bg-orange-600' : 'bg-gray-600'} rounded-full p-2 h-8 w-8 flex items-center justify-center`}>
                                        {message.type === 'ai' ? (
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                            </svg>
                                        ) : (
                                            <UserCircle className="w-4 h-4 text-white" />
                                        )}
                                    </div>

                                    {/* Message Content */}
                                    <div className={`p-3 rounded-lg ${message.type === 'user'
                                        ? 'bg-orange-600 text-white'
                                        : 'bg-gray-800 text-gray-100'
                                        }`}>
                                        <p className="text-sm">{message.content}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Input Area */}
                    <div className="space-y-2">
                        <textarea
                            id="prompt"
                            placeholder="Enter your prompt here..."
                            className="w-full h-32 px-3 py-2 text-sm text-gray-100 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors resize-none bg-gray-800"
                        />
                    </div>

                    <div className="space-y-2">
                        <select
                            id="model"
                            className="w-full px-3 py-2 text-sm text-gray-100 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-gray-800 cursor-pointer"
                        >
                            <option value="gpt-4o-mini">GPT-4o Mini</option>
                        </select>
                    </div>

                    <div className="flex space-x-2">
                        <button
                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                            Send
                        </button>
                    </div>
                </div>
            </div>

        </>
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
                console.error('Invalid operation type');
            }
        }, 1000 * i);  // Delay to allow for cell creation
    }
}

function insertCell(content: string, type: string, position: string) {
    const atIndex = getCellIndexFromRelativePosition(position);
    if (atIndex === -1) {
        console.error('Invalid position');
        return;
    }

    const notebook = document.querySelector('colab-shaded-scroller');
    if (!notebook) {
        console.error('Notebook element not found');
        return;
    }

    const lastCell = notebook.querySelector(`.notebook-cell-list > :nth-child(${atIndex})`);
    if (!lastCell) {
        console.error('Cell not found');
        return;
    }

    const addButtonGroup = atIndex === 0 ? notebook.querySelector('.add-cell') : lastCell.querySelector('.add-cell');
    if (!addButtonGroup) {
        console.error('Add button group not found');
        return;
    }

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
    if (!newCell) {
        console.error('New cell not found');
        return;
    }

    const id = newCell.getAttribute('id');

    // Use a custom event to pass data to the page context
    setTimeout(() => {
        const customEvent = new CustomEvent('setMonacoValue', {
            detail: { id: id, content: content, type: type }
        });
        document.dispatchEvent(customEvent);

    }, 500);  // Increased timeout to allow for cell creation
}

function updateCell(id: string, newContent: string) {
    const customEvent = new CustomEvent('setMonacoValue', {
        detail: { id: id, content: newContent }
    });
    document.dispatchEvent(customEvent);
}

function deleteCell(id: string) {
    const customEvent = new CustomEvent('deleteCell', { detail: { id: id } });
    document.dispatchEvent(customEvent);
}

function requestContent(callback: (content: string) => void) {
    function handleContentEvent(event: CustomEvent) {
        document.removeEventListener('contentValue', handleContentEvent as EventListener);
        callback(event.detail.content);
    }

    document.addEventListener('contentValue', handleContentEvent as EventListener);

    const customEvent = new CustomEvent('getContent');
    document.dispatchEvent(customEvent);
}

function getCellIndexFromRelativePosition(position: string): number {
    const notebook = document.querySelector('colab-shaded-scroller');
    if (!notebook) {
        console.error('Notebook element not found');
        return -1;
    }
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
        return -1;
    }
}


export default App
