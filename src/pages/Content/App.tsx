import React, { useState, useRef, useEffect } from 'react';
import '../../styles.css';
import ColResize from './ColResize';
import { ActionTextAreaWrapper } from './MentionTextArea';
import { ActionTextAreaRef } from './MentionTextArea/ActionTextArea';
import { useAI } from './hooks/useAI';
import { Message } from './Message';
import CellActions from './CellActions';
import { AVAILABLE_MODELS } from '../../../src/utils/models/types';

const [minWidth, maxWidth, defaultWidth] = [200, 500, 350];

const App = () => {
  const [width, setWidth] = useState(defaultWidth);

  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');

  const actionTextAreaRef = useRef<ActionTextAreaRef>(null);

  // Function to get focused cell ID
  const getFocusedCellId: () => string | null = () => {
    const focusedCell = document.querySelector('.cell.focused');
    return focusedCell?.getAttribute('id') || null;
  };

  useEffect(() => {
    chrome.storage.local.get('selected_model', (result) => {
      if (result.selected_model) {
        setModel(result.selected_model);
      }
    });
  }, []);

  const {
    generationState,
    messageManager,
    pendingOperations,
    acceptOperation,
    rejectOperation,
    acceptAllOperations,
    rejectAllOperations,
    generateAndInsertContent,
    restartAI,
  } = useAI(setPrompt, actionTextAreaRef);

  return (
    <>
      <ColResize setWidth={setWidth} minWidth={minWidth} maxWidth={maxWidth} />
      <div
        className="p-4 space-y-4 shadow-xl bg-gray-900 text-gray-100 flex flex-col justify-between"
        style={{ width: `${width / 16}rem` }}
      >
        <div className="flex flex-col overflow-hidden flex-1">
          <div className="flex items-center justify-between mb-6 flex-none">
            <div className="bg-gray-800 p-2 rounded-lg">
              <svg
                className="w-5 h-5 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                ></path>
              </svg>
            </div>
            <div className="flex items-center space-x-2 justify-between flex-1 mx-2">
              <h1 className="text-lg font-semibold text-white">ColabAI</h1>
              <div className="flex flex-none items-center space-x-2">
                {/* New Chat Button */}
                <button
                  onClick={restartAI}
                  className="px-2 py-1 text-xs flex flex-row flex-none gap-1 items-center text-orange-600 font-medium bg-gray-800 outline outline-1 outline-orange-600 rounded-lg hover:bg-orange-600 hover:text-white transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="currentColor"
                  >
                    <path d="M7 5C5.34315 5 4 6.34315 4 8V16C4 17.6569 5.34315 19 7 19H17C18.6569 19 20 17.6569 20 16V12.5C20 11.9477 20.4477 11.5 21 11.5C21.5523 11.5 22 11.9477 22 12.5V16C22 18.7614 19.7614 21 17 21H7C4.23858 21 2 18.7614 2 16V8C2 5.23858 4.23858 3 7 3H10.5C11.0523 3 11.5 3.44772 11.5 4C11.5 4.55228 11.0523 5 10.5 5H7Z" />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M18.8431 3.58579C18.0621 2.80474 16.7957 2.80474 16.0147 3.58579L11.6806 7.91992L11.0148 11.9455C10.8917 12.6897 11.537 13.3342 12.281 13.21L16.3011 12.5394L20.6347 8.20582C21.4158 7.42477 21.4158 6.15844 20.6347 5.37739L18.8431 3.58579ZM13.1933 11.0302L13.5489 8.87995L17.4289 5L19.2205 6.7916L15.34 10.6721L13.1933 11.0302Z"
                    />
                  </svg>
                  <span>New Chat</span>
                </button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div
            id="message-container"
            className="ai-scrollbar space-y-6 mb-4 overflow-y-auto"
          >
            {messageManager.messages.map((message, index) => (
              <Message
                key={index}
                message={message}
                index={index}
                isUpdatingNotebook={generationState.isUpdatingNotebook}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <ActionTextAreaWrapper
              actions={[
                {
                  label: 'Mention focused cell',
                  action: () => getFocusedCellId(),
                  id: 'mention-cell',
                },
              ]}
              onInput={setPrompt}
              onSubmit={() => {
                if (prompt && !generationState.isGenerating) {
                  generateAndInsertContent(prompt, model);
                }
              }}
              ref={actionTextAreaRef}
            />
          </div>

          <div className="space-y-2">
            <select
              id="model"
              className="w-full px-3 py-2 text-sm text-gray-100 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-gray-800 cursor-pointer"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {AVAILABLE_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
          {pendingOperations.size > 0 ? (
            <div className="flex space-x-2">
              <button
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
                onClick={acceptAllOperations}
              >
                {/* Accept */}
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                Accept All
              </button>
              <button
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
                onClick={rejectAllOperations}
              >
                {/* Reject */}
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
                Reject All
              </button>
            </div>
          ) : (
            <div className="flex space-x-2">
              <button
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 
                                rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 
                                focus:ring-offset-2 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                onClick={() => generateAndInsertContent(prompt, model)}
                disabled={generationState.isGenerating || !prompt}
              >
                {generationState.isGenerating ? (
                  <>
                    {/* Loading Indicator */}
                    <div
                      className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
                      role="status"
                    ></div>
                    Processing
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5l7 7-7 7"
                      ></path>
                    </svg>
                    Send
                  </>
                )}
              </button>
            </div>
          )}
          {generationState.error && (
            <div className="p-3 bg-red-900/50 text-red-400 rounded border border-red-500/20 text-sm">
              {generationState.error}
            </div>
          )}
        </div>
      </div>
      <CellActions
        diffCells={pendingOperations}
        handleAccept={acceptOperation}
        handleReject={rejectOperation}
      />
    </>
  );
};

// Inject the page script
const script = document.createElement('script');
script.src = chrome.runtime.getURL('pageScript.js');
document.body.appendChild(script);

export default App;
