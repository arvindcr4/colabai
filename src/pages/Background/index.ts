console.log('This is the background page.');
console.log('Put the background scripts here.');

import { NotebookChangeTracker, NotebookCell } from './change-tracker';

let notebookTracker: NotebookChangeTracker;
const messages: { role: string; content: string; }[] = [];

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
    const { command } = message
    switch (command) {
        case 'generateAI':
            console.log("Generating...");
            generateAIContent(message.prompt, message.content, message.model)
                .then(response => sendResponse({ success: true, data: response }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            break
        default:
            break
    }
})

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

    // Ensure you store the API key securely, and not in the source code directly
    const OPENAI_API_KEY = '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';

    if (messages.length == 0)
        messages.push({ role: "system", content: system_prompt });

    messages.push({
        role: "user",
        content: `${changeLog}\n\nUser request: ${prompt}`
    });

    console.log(messages);

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: messages
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log(data);
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error in AI content generation:', error);
        throw error;
    }
}

const system_prompt = `Google Colab Notebook Cell Manipulation Guidelines

You can perform the following operations on notebook cells. Use these command markers to specify operations:

Cell Operations:
1. Create new cell:
@CREATE[type=markdown|code, position=top|bottom|after:cell-{cellId}|before:cell-{cellId}]
content
@END

2. Delete cell:
@DELETE[cell-{cellId}]

3. Edit existing cell:
@EDIT[cell-{cellId}]
new content
@END

Required Structure:
- Start with H1 title for main topic
- Use H2/H3 headers for sections/subsections
- Begin with imports/setup
- End with summary/conclusion

Markdown Cells:
- Use formatting: bold, italic, lists, tables
- Add context before code cells
- Include LaTeX for math equations
- Embed diagrams/charts where needed

Code Cells:
- Break into logical chunks
- Add helpful comments
- Use descriptive names
- Group related code together

Notebook Changes:
- You will receive a list of changes that happened to the notebook cells
- This will include changes you made as well as changes made by the user

Examples:

1. Create new markdown cell after cell 123:
@CREATE[type=markdown, position=after:cell-123]
## Data Processing
In this section, we'll clean our dataset
@END

2. Create new code cell at bottom:
@CREATE[type=code, position=bottom]
def process_data(df):
    return df.dropna()
@END

3. Edit existing cell:
@EDIT[cell-456]
import pandas as pd
import numpy as np
@END

4. Delete cell:
@DELETE[cell-789]

Multiple Operations Example:
@CREATE[type=markdown, position=top]
# Data Analysis Project
@END

@CREATE[type=code, position=bottom]
import pandas as pd
@END

@EDIT[cell-123]
df = pd.read_csv('data.csv')
@END

Remember:
- Each operation must use the correct syntax
- Cell IDs must be specified for position-dependent operations
- Operations are executed in sequence
- Content between @CREATE/@EDIT and @END maintains original formatting
- For code cells, ensure proper indentation is preserved

Output Format:
The assistant should provide cell operations using the above syntax. Multiple operations can be specified in sequence.

Don't add any text before or after, just provide the operations.`;


chrome.commands.onCommand.addListener(command => {
    console.log(`Command: ${command}`)

    if (command === 'refresh_extension') {
        chrome.runtime.reload()
    }
})

chrome.webNavigation.onCompleted.addListener(
    async () => {
        //await chrome.action.openPopup();  // Ensure proper permissions in manifest
    },
    {
        url: [
            { urlMatches: 'https://colab.research.google.com/*' },
        ]
    },
);

export { }
