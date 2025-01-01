import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

// Component to be injected after each cell
export const CellDiff = ({ cellId, diff, onAccept, onReject }: { cellId: string, diff: boolean, onAccept?: () => void, onReject?: () => void }) => {

    if (!diff) {
        return null;
    }

    return (
        <div className='cell-actions-container'>
            <div className="flex items-center space-x-7 p-1 bg-gray-900">
                <div className="bg-gray-800 p-1 rounded-lg">
                    <svg
                        className="w-4 h-4 text-orange-600"
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
                <div className="flex flex-none bg-gray-800 rounded-lg">
                    <button className="flex space-x-2 items-center p-1 rounded-lg text-green-600 hover:bg-green-800 hover:text-white transition-colors"
                        onClick={onAccept}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            x="0px"
                            y="0px"
                            width="15"
                            height="15"
                            viewBox="0 0 50 50"
                            fill="currentColor"
                            stroke="currentColor"
                        >
                            <path
                                d="M 41.9375 8.625 C 41.273438 8.648438 40.664063 9 40.3125 9.5625 L 21.5 38.34375 L 9.3125 27.8125 C 8.789063 27.269531 8.003906 27.066406 7.28125 27.292969 C 6.5625 27.515625 6.027344 28.125 5.902344 28.867188 C 5.777344 29.613281 6.078125 30.363281 6.6875 30.8125 L 20.625 42.875 C 21.0625 43.246094 21.640625 43.410156 22.207031 43.328125 C 22.777344 43.242188 23.28125 42.917969 23.59375 42.4375 L 43.6875 11.75 C 44.117188 11.121094 44.152344 10.308594 43.78125 9.644531 C 43.410156 8.984375 42.695313 8.589844 41.9375 8.625 Z"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                            ></path>
                        </svg>
                    </button>
                    <button className="flex space-x-2 items-center p-1 rounded-lg text-red-600 hover:bg-red-800 hover:text-white transition-colors"
                        onClick={onReject}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="15"
                            height="15"
                            x="0"
                            y="0"
                            viewBox="0 0 512 512"
                            fill="currentColor"
                            stroke="currentColor"
                        >
                            <path d="M437.5 386.6L306.9 256l130.6-130.6c14.1-14.1 14.1-36.8 0-50.9-14.1-14.1-36.8-14.1-50.9 0L256 205.1 125.4 74.5c-14.1-14.1-36.8-14.1-50.9 0-14.1 14.1-14.1 36.8 0 50.9L205.1 256 74.5 386.6c-14.1 14.1-14.1 36.8 0 50.9 14.1 14.1 36.8 14.1 50.9 0L256 306.9l130.6 130.6c14.1 14.1 36.8 14.1 50.9 0 14-14.1 14-36.9 0-50.9z"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

// // Function to inject CellActions component
// export function injectCellActions(cellId: string, diff: boolean, onAccept: () => void, onReject: () => void) {
//     const cell = document.getElementById(cellId);
//     if (!cell) return;

//     const toolbar = cell.querySelector('.cell-tag-editor');
//     if (!toolbar) return;

//     // Create container for the React component
//     let container = toolbar.querySelector('.cell-actions-container');
//     if (!container) {
//         container = document.createElement('div');
//         container.className = 'cell-actions-container';
//         toolbar.appendChild(container);
//     }

//     // Create React root and render component
//     let root = (container as any)._reactRoot;
//     if (!root) {
//         root = createRoot(container);
//         (container as any)._reactRoot = root;
//     }

//     cell.setAttribute('data-diff', diff.toString());

//     root.render(
//         <CellDiff
//             cellId={cellId}
//             diff={diff}
//             onAccept={onAccept}
//             onReject={onReject}
//         />
//     );
// }

// // New function to inject actions into all cells
// export function injectAllCellActions() {
//     const notebook = document.querySelector('colab-shaded-scroller');
//     if (!notebook) return;

//     const cells = notebook.querySelectorAll('.cell');
//     cells.forEach(cell => {
//         const id = cell.getAttribute('id');
//         if (id) {
//             injectCellActions(id, false, () => { }, () => { });
//         }
//     });

//     // Observe for new cells
//     const observer = new MutationObserver((mutations) => {
//         mutations.forEach((mutation) => {
//             mutation.addedNodes.forEach((node) => {
//                 if (node instanceof HTMLElement && node.classList.contains('cell')) {
//                     const id = node.getAttribute('id');
//                     if (id) {
//                         injectCellActions(id, false, () => { }, () => { });
//                     }
//                 }
//             });
//         });
//     });

//     observer.observe(notebook.querySelector('.notebook-cell-list') || notebook, {
//         childList: true,
//         subtree: true
//     });
// }