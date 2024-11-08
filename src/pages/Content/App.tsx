import React, { useEffect, useState, useRef } from 'react'
import { handleStreamingContent, initializeStreamingState, Operation } from './parser'
import '../../styles.css';
import { UserCircle } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ExtPay from 'extpay';

const [minWidth, maxWidth, defaultWidth] = [200, 500, 350];
const initialMessages = [
    {
        type: 'ai',
        content: 'Welcome to the Colab AI Assistant! Enter your prompt in the text area below and click "Send" to generate content.'
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
];

var extpay = ExtPay('colab');

const App = () => {

    const [width, setWidth] = useState(defaultWidth);
    const isResized = useRef(false);
    const overlay = useRef<HTMLDivElement | null>(null);

    const [prompt, setPrompt] = useState('');
    const [model, setModel] = useState('gpt-4o-mini');
    const [messages, setMessages] = useState(initialMessages);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isUpdatingNotebook, setIsUpdatingNotebook] = useState(false);

    const [isPaid, setIsPaid] = useState(false);

    const setCurrentMessage = (message: ((prevCurrent: string) => string) | string) => {
        setMessages((previousMessages) => {
            const newMessage = typeof message === 'function' ? message(previousMessages[previousMessages.length - 1]?.content || '') : message;
            const updatedMessages = [...previousMessages];
            updatedMessages[updatedMessages.length - 1] = { ...updatedMessages[updatedMessages.length - 1], content: newMessage };
            return updatedMessages;
        });
    }

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

        extpay.getUser().then(user => {
            if (user.paid === true) {
                setIsPaid(true);
            }
        }).catch(err => {
            console.log("Error fetching data :( Check that your ExtensionPay id is correct and you're connected to the internet");
        })

        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            const { action } = message;
            switch (action) {
                case 'streamed_response':
                    handleStreamingContent(message.content, message.done, applyOperation, setCurrentMessage, (isCode) => setIsUpdatingNotebook(isCode));
                    sendResponse({ success: true });

                    if (message.done) {
                        setIsUpdatingNotebook(false);
                        setIsGenerating(false);
                    }

                    return true;
                    break;
                default:
                    break;
            }
        });

    }, [])


    function generateAndInsertContent(prompt: string, model: string) {

        setCurrentMessage(''); // Clear the current message
        setPrompt(''); // Clear the prompt
        setIsGenerating(true);
        initializeStreamingState();

        messages.push({ type: 'user', content: prompt });
        messages.push({ type: 'ai', content: '' });

        requestContent((content: string) => {
            chrome.runtime.sendMessage(
                { action: "generateAI", prompt: prompt, content: content, model: model }
            );
        });
    }

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
                <div className="flex flex-col overflow-hidden flex-1">
                    <div className="flex items-center space-x-2 mb-6 flex-none">
                        <div className="bg-gray-800 p-2 rounded-lg">
                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" ></path>
                            </svg>
                        </div>
                        <h1 className="text-lg font-semibold text-white"> Colab AI Assistant </h1>
                    </div>

                    {/* Messages Area */}
                    <div className="ai-scrollbar space-y-4 mb-4 overflow-y-auto">
                        {messages.map((message, index) => (
                            <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex gap-2 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Avatar */}
                                    <div className={`flex-shrink-0 ${message.type === 'ai' ? 'bg-orange-600' : 'bg-gray-600'} rounded-full p-2 max-h-8 max-w-8 flex items-center justify-center`}>
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
                                        {/* <p className="text-sm">{message.content}</p> */}
                                        {message.content.split('@START_CODE').map((content, index) => (
                                            (index > 0 &&
                                                <>
                                                    <div key={`${index}-updating`} className={(isUpdatingNotebook ? "animate-pulse " : "") + "bg-gray-800 p-2 rounded-lg my-2 flex flex-row justify-evenly max-w-52 space-x-2 border-2 border-orange-600"}>
                                                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" ></path>
                                                        </svg>
                                                        <p><strong>Updating Notebook</strong></p>
                                                    </div>
                                                    {content.trim().length > 0 && <Markdown key={index} remarkPlugins={[remarkGfm]}>{content}</Markdown>}
                                                </>
                                            ) || (
                                                (content.trim().length > 0 && <Markdown key={index} remarkPlugins={[remarkGfm]}>{content}</Markdown>)
                                            )
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    {isPaid ? (
                        <div className="flex items-center space-x-2 p-2 bg-green-500 rounded-lg">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <p className="text-white">You are subscribed to the Colab AI Assistant</p>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2 p-2 bg-red-500 rounded-lg">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                            <p className="text-white">You are not subscribed to the Colab AI Assistant</p>
                        </div>
                    )}
                    {/* Input Area */}
                    <div className="space-y-2">
                        <textarea
                            id="prompt"
                            placeholder="Enter your prompt here..."
                            className="w-full h-32 px-3 py-2 text-sm text-gray-100 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors resize-none bg-gray-800"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <select
                            id="model"
                            className="w-full px-3 py-2 text-sm text-gray-100 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-gray-800 cursor-pointer"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                        >
                            <option value="gpt-4o-mini">GPT-4o Mini</option>
                            <option value="gpt-4o">GPT-4o</option>
                        </select>
                    </div>

                    <div className="flex space-x-2">
                        <button
                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 
                            rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 
                            focus:ring-offset-2 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            onClick={() => generateAndInsertContent(prompt, model)}
                            disabled={isGenerating}
                        >
                            {isGenerating ?
                                <>
                                    {/* Loading Indicator */}
                                    <div
                                        className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
                                        role="status">
                                    </div>
                                    Processing
                                </> : <>
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                    </svg>
                                    Send
                                </>
                            }
                        </button>
                    </div>
                </div>
            </div >

        </>
    )
}

function applyOperation(operation: Operation): string | null {
    if (operation.type === 'create') {
        return insertCell(operation.content, operation.cellType, operation.position);
    } else if (operation.type === 'edit') {
        return updateCell(operation.cellId, operation.content);
    } else if (operation.type === 'delete') {
        return deleteCell(operation.cellId);
    }
    return null;
}

function insertCell(content: string, type: string, position: string): string | null {
    const atIndex = getCellIndexFromRelativePosition(position);
    if (atIndex === -1) {
        console.error('Invalid position');
        return null;
    }

    const notebook = document.querySelector('colab-shaded-scroller');
    if (!notebook) {
        console.error('Notebook element not found');
        return null;
    }

    const lastCell = notebook.querySelector(`.notebook-cell-list > :nth-child(${atIndex})`);
    if (atIndex !== 0 && !lastCell) {
        console.error('Cell not found');
        return null;
    }

    const addButtonGroup = atIndex === 0 ? notebook.querySelector('.add-cell') : lastCell?.querySelector('.add-cell');
    if (!addButtonGroup) {
        console.error('Add button group not found');
        return null;
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
        return null;
    }

    const id = newCell.getAttribute('id');
    if (content === '') {
        return id;
    }

    // Use a custom event to pass data to the page context
    setTimeout(() => {
        const customEvent = new CustomEvent('setMonacoValue', {
            detail: { id: id, content: content, type: type }
        });
        document.dispatchEvent(customEvent);

    }, 500);  // Increased timeout to allow for cell creation

    return id;
}

function updateCell(id: string, newContent: string) {
    const customEvent = new CustomEvent('setMonacoValue', {
        detail: { id: id, content: newContent }
    });
    document.dispatchEvent(customEvent);

    return id;
}

function deleteCell(id: string) {
    const customEvent = new CustomEvent('deleteCell', { detail: { id: id } });
    document.dispatchEvent(customEvent);

    return id;
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
