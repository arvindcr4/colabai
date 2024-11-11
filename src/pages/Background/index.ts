console.log('This is the background page.');
console.log('Put the background scripts here.');

import { NotebookChangeTracker, NotebookCell } from './change-tracker';
import ExtPay from 'extpay';

let notebookTracker: NotebookChangeTracker;
const messages: { role: string; content: string; }[] = [];

var extpay = new (ExtPay as any)('colab');
extpay.startBackground();

console.log('Background Service Worker Loaded')

chrome.runtime.onInstalled.addListener(async () => {
    console.log('Extension installed')
})

chrome.action.setBadgeText({ text: 'ON' })

chrome.action.onClicked.addListener(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const activeTab = tabs[0]
        chrome.tabs.sendMessage(activeTab.id!, { message: 'clicked_browser_action' })
    })
})
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { action } = message;
    switch (action) {
        case 'generateAI':
            console.log("Generating...");
            generateAIContent(message.prompt, message.content, message.model)
                .then(() => {
                    sendResponse({ success: true });
                })
                .catch(error => {
                    console.error("Error generating AI content: ", error);
                    sendResponse({ success: false, error: error.message })
                });
            return true; // Indicate that the response will be sent asynchronously
        default:
            sendResponse({ success: false, error: `Invalid action: ${action}` });
            return false;
    }
});

function trackNotebookChanges(currentCells: NotebookCell[]) {
    const tracker = notebookTracker || new NotebookChangeTracker();
    notebookTracker = tracker;
    console.log('Tracking notebook changes');

    return tracker.updateState(currentCells);
}

async function generateAIContent(prompt: string, content: NotebookCell[], model = "gpt-3.5-turbo") {
    console.log("Generating AI content...");
    console.log("Previous content:", content);
    const changeLog = trackNotebookChanges(content);

    console.log(changeLog);

    if (messages.length == 0)
        messages.push({ role: "system", content: system_prompt });

    messages.push({
        role: "user",
        content: `Changes since last message:\n\n${changeLog}\n\nUser request: ${prompt}`
    });

    console.log(messages);
    try {

        // Send request to lambda function
        const response = await fetch('https://qgvdlmluaznyzdv4jkfrw3oqee0rvber.lambda-url.eu-north-1.on.aws/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_AUTH_TOKEN'
            },
            body: JSON.stringify({
                messages: messages,
                model: model
            })
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder("utf-8");
        let done = false;

        if (reader == null) {
            throw new Error("Response body is null");
        }

        while (!done) {
            const { value, done: chunkDone } = await reader.read();
            if (value) {
                console.log(new TextDecoder().decode(value));

                let textChunk = decoder.decode(value, { stream: true });
                let boundary;
                const data: any[] = [];

                // Separate JSON objects that arrive together in a single chunk
                while ((boundary = textChunk.indexOf("}{")) !== -1) {
                    // Separate the first JSON object
                    const jsonStr = textChunk.slice(0, boundary + 1);
                    textChunk = textChunk.slice(boundary + 1);

                    // Parse and process the JSON
                    data.push(JSON.parse(jsonStr));
                }

                // Process the remaining JSON
                data.push(JSON.parse(textChunk));

                chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                    data.forEach((data) => {
                        chrome.tabs.sendMessage(tabs[0].id!, {
                            action: 'streamed_response',
                            content: data.content,
                            done: data.done
                        });
                    });
                });
            }
            done = chunkDone;
        }

    } catch (error) {
        console.error("Error generating AI content: ", error);
    }
}

const system_prompt = `# Google Colab Cell Operations Guide

## Basic Operations
Use these commands to manipulate notebook cells:

1. Create: 
@CREATE[type=markdown|code, position=top|bottom|after:cell-{id}|before:cell-{id}]
content
@END

2. Edit (remember that the content in the edit operation replaces all previous content):
@EDIT[cell-{id}]
content
@END

3. Delete:
@DELETE[cell-{id}]

## Response Structure
- Start operations with '@START_CODE'
- End operations with '@END_CODE'
- Write explanatory text before/after markers
- Keep responses brief and clear

## Notebook Guidelines
- Use H1 for main topic, H2/H3 for sections
- Start with imports/setup
- Include context in markdown cells before code
- Write clean, commented code in logical chunks
- End with summary/conclusion

## Changelog
Changes between '@CHANGELOG' and '@END_CHANGELOG' are informational only - do not include in responses.

Remember:
- Operations execute in sequence
- Preserve original formatting between @CREATE/@EDIT and @END
- Maintain proper code indentation
- Avoid redundant and empty content
- Use descriptive names and helpful comments`;

// const system_prompt = `Google Colab Notebook Cell Manipulation Guidelines

// You can perform the following operations on notebook cells. Use these command markers to specify operations:

// Cell Operations:
// 1. Create new cell:
// @CREATE[type=markdown|code, position=top|bottom|after:cell-{cellId}|before:cell-{cellId}]
// content
// @END

// 2. Delete cell:
// @DELETE[cell-{cellId}]

// 3. Edit existing cell (remember that in edit, the new content replaces all the previous content. So always write the whole cell from start to end):
// @EDIT[cell-{cellId}]
// new content
// @END

// These are the ONLY operations you can perform on notebook cells. Make sure to follow the correct syntax and structure for each operation.

// Required Structure:
// - Start with H1 title for main topic
// - Use H2/H3 headers for sections/subsections
// - Begin with imports/setup
// - End with summary/conclusion

// Markdown Cells:
// - Use formatting: bold, italic, lists, tables
// - Add context before code cells
// - Include LaTeX for math equations
// - Embed diagrams/charts where needed

// Code Cells:
// - Break into logical chunks
// - Add helpful comments
// - Use descriptive names
// - Group related code together

// Notebook Changes (Between @CHANGELOG and @END_CHANGELOG):
// - You will receive a list of changes that happened to the notebook cells since the last message
// - This will include changes you made as well as changes made by the user
// - These are not commands, but a summary of changes that happened before. Don't include these in your response
// - These changes are cumulative and will be sent in sequence

// Start and End Markers:
// - To start writing the operations use @START_CODE
// - To end writing the operations use @END_CODE
// - You can write in normal text before and after these markers, explaining what you are doing or replying to the user
// - Be very brief and clear in your responses before and after the markers. Also don't attempt to write in markdown format

// Sample Examples:

// 1. Create new markdown cell after cell 123:
// @CREATE[type=markdown, position=after:cell-123]
// ## Data Processing
// In this section, we'll clean our dataset
// @END

// 2. Create new code cell at bottom:
// @CREATE[type=code, position=bottom]
// def process_data(df):
//     return df.dropna()
// @END

// 3. Edit existing cell:
// @EDIT[cell-456]
// import pandas as pd
// import numpy as np
// @END

// 4. Delete cell:
// @DELETE[cell-789]

// Full Example:
// Sure thing! Here's a sample structure for a data analysis project:
// @START_CODE
// @CREATE[type=markdown, position=top]
// # Data Analysis Project
// @END

// @CREATE[type=code, position=bottom]
// import pandas as pd
// @END

// @EDIT[cell-123]
// df = pd.read_csv('data.csv')
// @END
// ...
// @END_CODE
// This will help you get started with your project. Let me know if you need any more help!

// Remember:
// - Each operation must use the correct syntax
// - Cell IDs must be specified for position-dependent operations
// - Operations are executed in sequence
// - Content between @CREATE/@EDIT and @END maintains original formatting
// - For code cells, ensure proper indentation is preserved
// - Be smart with the layout. If part of the content is already present, don't repeat it. Remove unnecessary or redundant content.

// Output Format:
// The assistant should provide cell operations using the above syntax. Multiple operations can be specified in sequence. The final output should be a well-structured notebook with the requested changes.`;


chrome.commands.onCommand.addListener(command => {
    console.log(`Command: ${command}`)

    if (command === 'refresh_extension') {
        chrome.runtime.reload()
    }
})

export { }
