console.log('This is the background page.');
console.log('Put the background scripts here.');

import { NotebookChangeTracker, NotebookCell } from './change-tracker';
import OpenAI from 'openai';
import ExtPay from 'extpay';

let notebookTracker: NotebookChangeTracker;
const messages: { role: string; content: string; }[] = [];
let openai: any;

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
        const stream = await openai.chat.completions.create({
            model: model,
            messages: messages as any,
            stream: true
        });

        chrome.tabs.query({ active: true, currentWindow: true }, async tabs => {
            const activeTab = tabs[0]
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || "";
                const done = chunk.choices[0]?.finish_reason === 'stop';

                chrome.tabs.sendMessage(activeTab.id!, { action: 'streamed_response', content, done }, response => {
                });
            }
        });
    } catch (error) {
        console.error("Error generating AI content: ", error);
    }
}

async function generateAIContentTest() {
    const response = "Sure! I will create a simple Python Snake Game using the PGZ (Pygame Zero) library. Let's start by setting up the necessary structure in your notebook. @START_CODE @CREATE[type=markdown, position=top] # Simple Python Snake Game In this notebook, we will create a simple Snake Game using the Pygame library. Follow along as we build the game step by step. @END @CREATE[type=markdown, position=bottom] ## Game Setup First, we need to install Pygame, as it will be used to create the game window and handle game events. Make sure to install it before running the game. @END @CREATE[type=code, position=bottom] !pip install pgzero @END @CREATE[type=markdown, position=bottom] ## Importing Libraries Next, we will import the necessary libraries for our game. @END @EDIT[cell-vYQG-UVWi-V1] import pgzrun from random import choice, randint WIDTH = 800 HEIGHT = 600 snake = [(100, 100), (90, 100), (80, 100)] snake_dir = (10, 0) food = (400, 300) score = 0 @END @CREATE[type=markdown, position=bottom] ## Game Functions Now we will define the functions that will handle the game's logic. @END @CREATE[type=code, position=bottom] def draw(): screen.clear() screen.draw.text(f'Score: {score}', (10, 10), fontsize=40) for segment in snake: screen.draw.filled_rect(Rect(segment, (10, 10)), 'green') screen.draw.filled_rect(Rect(food, (10, 10)), 'red') def update(): global score head_x, head_y = snake[0] head_x += snake_dir[0] head_y += snake_dir[1] snake.insert(0, (head_x, head_y)) if (head_x, head_y) == food: score += 1 place_food() else: snake.pop() def place_food(): global food food = (randint(0, WIDTH // 10 - 1) * 10, randint(0, HEIGHT // 10 - 1) * 10) def on_key_down(key): global snake_dir if key == keys.UP and snake_dir != (0, 10): snake_dir = (0, -10) elif key == keys.DOWN and snake_dir != (0, -10): snake_dir = (0, 10) elif key == keys.LEFT and snake_dir != (10, 0): snake_dir = (-10, 0) elif key == keys.RIGHT and snake_dir != (-10, 0): snake_dir = (10, 0) @END @CREATE[type=markdown, position=bottom] ## Running the Game Finally, we will run the game. This will create the game window and all the necessary game loop logic. @END @CREATE[type=code, position=bottom] pgzrun.go() @END @END_CODE This structure sets up a simple Snake Game using the Pygame library. You can run each cell in sequence to see how the game develops. Let me know if you need additional features or modifications!";

    chrome.tabs.query({ active: true, currentWindow: true }, async tabs => {
        const activeTab = tabs[0]
        for await (const chunk of response.split(' ')) {
            console.log(chunk || "");

            chrome.tabs.sendMessage(activeTab.id!, { action: 'streamed_response', content: chunk || "" }, response => {
                console.log(response);
            });
        }
    });
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

These are the ONLY operations you can perform on notebook cells. Make sure to follow the correct syntax and structure for each operation.

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

Notebook Changes (Between @CHANGELOG and @END_CHANGELOG):
- You will receive a list of changes that happened to the notebook cells since the last message
- This will include changes you made as well as changes made by the user
- These are not commands, but a summary of changes that happened before. Don't include these in your response
- These changes are cumulative and will be sent in sequence

Start and End Markers:
- To start writing the operations use @START_CODE
- To end writing the operations use @END_CODE
- You can write in normal text before and after these markers, explaining what you are doing or replying to the user
- Be very brief and clear in your responses before and after the markers. Also don't attempt to write in markdown format

Sample Examples:

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

Full Example:
Sure thing! Here's a sample structure for a data analysis project:
@START_CODE
@CREATE[type=markdown, position=top]
# Data Analysis Project
@END

@CREATE[type=code, position=bottom]
import pandas as pd
@END

@EDIT[cell-123]
df = pd.read_csv('data.csv')
@END
...
@END_CODE
This will help you get started with your project. Let me know if you need any more help!

Remember:
- Each operation must use the correct syntax
- Cell IDs must be specified for position-dependent operations
- Operations are executed in sequence
- Content between @CREATE/@EDIT and @END maintains original formatting
- For code cells, ensure proper indentation is preserved
- Be smart with the layout. If part of the content is already present, don't repeat it. Remove unnecessary or redundant content.

Output Format:
The assistant should provide cell operations using the above syntax. Multiple operations can be specified in sequence. The final output should be a well-structured notebook with the requested changes.`;


chrome.commands.onCommand.addListener(command => {
    console.log(`Command: ${command}`)

    if (command === 'refresh_extension') {
        chrome.runtime.reload()
    }
})

export { }
