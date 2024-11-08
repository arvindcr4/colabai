"use strict";
self["webpackHotUpdatechrome_extension_boilerplate_react"]("background",{

/***/ "./src/pages/Background/index.ts":
/*!***************************************!*\
  !*** ./src/pages/Background/index.ts ***!
  \***************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _change_tracker__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./change-tracker */ "./src/pages/Background/change-tracker.ts");
/* harmony import */ var openai__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! openai */ "./node_modules/openai/index.mjs");
/* harmony import */ var extpay__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! extpay */ "./node_modules/extpay/dist/ExtPay.module.js");
/* provided dependency */ var __react_refresh_utils__ = __webpack_require__(/*! ./node_modules/@pmmmwh/react-refresh-webpack-plugin/lib/runtime/RefreshUtils.js */ "./node_modules/@pmmmwh/react-refresh-webpack-plugin/lib/runtime/RefreshUtils.js");
/* provided dependency */ var __react_refresh_error_overlay__ = __webpack_require__(/*! ./node_modules/@pmmmwh/react-refresh-webpack-plugin/overlay/index.js */ "./node_modules/@pmmmwh/react-refresh-webpack-plugin/overlay/index.js");
__webpack_require__.$Refresh$.runtime = __webpack_require__(/*! ./node_modules/react-refresh/runtime.js */ "./node_modules/react-refresh/runtime.js");

var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (undefined && undefined.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
console.log('This is the background page.');
console.log('Put the background scripts here.');



let notebookTracker;
const messages = [];
let openai;
fetch('https://r378u5dqj3.execute-api.eu-north-1.amazonaws.com/default/colabGetData', {
    method: 'post',
})
    .then(response => response.text())
    .then(data => {
    const key = JSON.parse(data).message;
    openai = new openai__WEBPACK_IMPORTED_MODULE_2__["default"]({ apiKey: key });
});
var extpay = new extpay__WEBPACK_IMPORTED_MODULE_1__["default"]('colab');
extpay.startBackground();
console.log('Background Service Worker Loaded');
chrome.runtime.onInstalled.addListener(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Extension installed');
}));
chrome.action.setBadgeText({ text: 'ON' });
chrome.action.onClicked.addListener(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, { message: 'clicked_browser_action' });
    });
});
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
                sendResponse({ success: false, error: error.message });
            });
            return true; // Indicate that the response will be sent asynchronously
        default:
            sendResponse({ success: false, error: `Invalid action: ${action}` });
            return false;
    }
});
function trackNotebookChanges(currentCells) {
    const tracker = notebookTracker || new _change_tracker__WEBPACK_IMPORTED_MODULE_0__.NotebookChangeTracker();
    notebookTracker = tracker;
    console.log('Tracking notebook changes');
    return tracker.updateState(currentCells);
}
function generateAIContent(prompt, content, model = "gpt-3.5-turbo") {
    return __awaiter(this, void 0, void 0, function* () {
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
            const stream = yield openai.chat.completions.create({
                model: model,
                messages: messages,
                stream: true
            });
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => __awaiter(this, void 0, void 0, function* () {
                var _a, e_1, _b, _c;
                var _d, _e, _f;
                const activeTab = tabs[0];
                try {
                    for (var _g = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = yield stream_1.next(), _a = stream_1_1.done, !_a;) {
                        _c = stream_1_1.value;
                        _g = false;
                        try {
                            const chunk = _c;
                            const content = ((_e = (_d = chunk.choices[0]) === null || _d === void 0 ? void 0 : _d.delta) === null || _e === void 0 ? void 0 : _e.content) || "";
                            const done = ((_f = chunk.choices[0]) === null || _f === void 0 ? void 0 : _f.finish_reason) === 'stop';
                            chrome.tabs.sendMessage(activeTab.id, { action: 'streamed_response', content, done }, response => {
                            });
                        }
                        finally {
                            _g = true;
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (!_g && !_a && (_b = stream_1.return)) yield _b.call(stream_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }));
        }
        catch (error) {
            console.error("Error generating AI content: ", error);
        }
    });
}
function generateAIContentTest() {
    return __awaiter(this, void 0, void 0, function* () {
        const response = "Sure! I will create a simple Python Snake Game using the PGZ (Pygame Zero) library. Let's start by setting up the necessary structure in your notebook. @START_CODE @CREATE[type=markdown, position=top] # Simple Python Snake Game In this notebook, we will create a simple Snake Game using the Pygame library. Follow along as we build the game step by step. @END @CREATE[type=markdown, position=bottom] ## Game Setup First, we need to install Pygame, as it will be used to create the game window and handle game events. Make sure to install it before running the game. @END @CREATE[type=code, position=bottom] !pip install pgzero @END @CREATE[type=markdown, position=bottom] ## Importing Libraries Next, we will import the necessary libraries for our game. @END @EDIT[cell-vYQG-UVWi-V1] import pgzrun from random import choice, randint WIDTH = 800 HEIGHT = 600 snake = [(100, 100), (90, 100), (80, 100)] snake_dir = (10, 0) food = (400, 300) score = 0 @END @CREATE[type=markdown, position=bottom] ## Game Functions Now we will define the functions that will handle the game's logic. @END @CREATE[type=code, position=bottom] def draw(): screen.clear() screen.draw.text(f'Score: {score}', (10, 10), fontsize=40) for segment in snake: screen.draw.filled_rect(Rect(segment, (10, 10)), 'green') screen.draw.filled_rect(Rect(food, (10, 10)), 'red') def update(): global score head_x, head_y = snake[0] head_x += snake_dir[0] head_y += snake_dir[1] snake.insert(0, (head_x, head_y)) if (head_x, head_y) == food: score += 1 place_food() else: snake.pop() def place_food(): global food food = (randint(0, WIDTH // 10 - 1) * 10, randint(0, HEIGHT // 10 - 1) * 10) def on_key_down(key): global snake_dir if key == keys.UP and snake_dir != (0, 10): snake_dir = (0, -10) elif key == keys.DOWN and snake_dir != (0, -10): snake_dir = (0, 10) elif key == keys.LEFT and snake_dir != (10, 0): snake_dir = (-10, 0) elif key == keys.RIGHT and snake_dir != (-10, 0): snake_dir = (10, 0) @END @CREATE[type=markdown, position=bottom] ## Running the Game Finally, we will run the game. This will create the game window and all the necessary game loop logic. @END @CREATE[type=code, position=bottom] pgzrun.go() @END @END_CODE This structure sets up a simple Snake Game using the Pygame library. You can run each cell in sequence to see how the game develops. Let me know if you need additional features or modifications!";
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => __awaiter(this, void 0, void 0, function* () {
            var _a, e_2, _b, _c;
            const activeTab = tabs[0];
            try {
                for (var _d = true, _e = __asyncValues(response.split(' ')), _f; _f = yield _e.next(), _a = _f.done, !_a;) {
                    _c = _f.value;
                    _d = false;
                    try {
                        const chunk = _c;
                        console.log(chunk || "");
                        chrome.tabs.sendMessage(activeTab.id, { action: 'streamed_response', content: chunk || "" }, response => {
                            console.log(response);
                        });
                    }
                    finally {
                        _d = true;
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                }
                finally { if (e_2) throw e_2.error; }
            }
        }));
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
    console.log(`Command: ${command}`);
    if (command === 'refresh_extension') {
        chrome.runtime.reload();
    }
});


const $ReactRefreshModuleId$ = __webpack_require__.$Refresh$.moduleId;
const $ReactRefreshCurrentExports$ = __react_refresh_utils__.getModuleExports(
	$ReactRefreshModuleId$
);

function $ReactRefreshModuleRuntime$(exports) {
	if (true) {
		let errorOverlay;
		if (typeof __react_refresh_error_overlay__ !== 'undefined') {
			errorOverlay = __react_refresh_error_overlay__;
		}
		let testMode;
		if (typeof __react_refresh_test__ !== 'undefined') {
			testMode = __react_refresh_test__;
		}
		return __react_refresh_utils__.executeRuntime(
			exports,
			$ReactRefreshModuleId$,
			module.hot,
			errorOverlay,
			testMode
		);
	}
}

if (typeof Promise !== 'undefined' && $ReactRefreshCurrentExports$ instanceof Promise) {
	$ReactRefreshCurrentExports$.then($ReactRefreshModuleRuntime$);
} else {
	$ReactRefreshModuleRuntime$($ReactRefreshCurrentExports$);
}

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("46c49f4532132f0e5f22")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=background.2e32150ceebc516bd10c.hot-update.js.map