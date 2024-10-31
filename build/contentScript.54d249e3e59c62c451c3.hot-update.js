"use strict";
self["webpackHotUpdatechrome_extension_boilerplate_react"]("contentScript",{

/***/ "./src/pages/Content/App.tsx":
/*!***********************************!*\
  !*** ./src/pages/Content/App.tsx ***!
  \***********************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _parser__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./parser */ "./src/pages/Content/parser.ts");
/* harmony import */ var _styles_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../styles.css */ "./src/styles.css");
/* harmony import */ var lucide_react__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! lucide-react */ "./node_modules/lucide-react/dist/esm/icons/circle-user.js");
/* provided dependency */ var __react_refresh_utils__ = __webpack_require__(/*! ./node_modules/@pmmmwh/react-refresh-webpack-plugin/lib/runtime/RefreshUtils.js */ "./node_modules/@pmmmwh/react-refresh-webpack-plugin/lib/runtime/RefreshUtils.js");
/* provided dependency */ var __react_refresh_error_overlay__ = __webpack_require__(/*! ./node_modules/@pmmmwh/react-refresh-webpack-plugin/overlay/index.js */ "./node_modules/@pmmmwh/react-refresh-webpack-plugin/overlay/index.js");
__webpack_require__.$Refresh$.runtime = __webpack_require__(/*! ./node_modules/react-refresh/runtime.js */ "./node_modules/react-refresh/runtime.js");

var _a;
var _b;
_b = __webpack_require__.$Refresh$.signature();




var _c = [200, 500, 350], minWidth = _c[0], maxWidth = _c[1], defaultWidth = _c[2];
var messages = [
    {
        type: 'user',
        content: 'Can you help me understand how to implement a binary search tree?'
    },
    {
        type: 'ai',
        content: 'Of course! A binary search tree is a data structure where each node has at most two children, with all left descendants being less than the current node, and all right descendants being greater. Would you like me to explain the implementation details?'
    }
];
var App = function () {
    _b();
    var _c = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(defaultWidth), width = _c[0], setWidth = _c[1];
    var isResized = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(false);
    var overlay = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
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
        overlay.current.addEventListener("mousemove", function (e) {
            if (!isResized.current) {
                return;
            }
            setWidth(function (previousWidth) {
                var newWidth = window.innerWidth - e.pageX;
                var isWidthInRange = newWidth >= minWidth && newWidth <= maxWidth;
                return isWidthInRange ? newWidth : previousWidth;
            });
            e.preventDefault();
            pauseEvent(e);
        });
        overlay.current.addEventListener("mouseup", function () {
            isResized.current = false;
            if (overlay.current)
                overlay.current.style.display = 'none';
        });
        function pauseEvent(e) {
            if (e.stopPropagation)
                e.stopPropagation();
            if (e.preventDefault)
                e.preventDefault();
            e.cancelBubble = true;
            e.returnValue = false;
            return false;
        }
    }, []);
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
        // Inject the page script
        var script = document.createElement('script');
        script.src = chrome.runtime.getURL('pageScript.js');
        document.body.appendChild(script);
        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
            if (request.action === "contentScriptReady") {
                sendResponse({ ready: true });
            }
            else if (request.action === "applyOperations") {
                applyOperations(request.content);
                sendResponse({ success: true });
            }
            else if (request.action === "getContent") {
                requestContent(function (content) {
                    sendResponse({ success: true, data: content });
                });
            }
            return true; // Indicates we will send a response asynchronously
        });
    }, []);
    return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null,
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "w-2 cursor-col-resize", onMouseDown: function () {
                isResized.current = true;
                if (overlay.current) {
                    overlay.current.style.display = 'block';
                }
            } }),
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "p-4 space-y-4 shadow-xl bg-gray-900 text-gray-100 flex flex-col justify-between", style: { width: "".concat(width / 16, "rem") } },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null,
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "flex items-center space-x-2 mb-6" },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "bg-gray-800 p-2 rounded-lg" },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("svg", { className: "w-5 h-5 text-orange-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg" },
                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M13 10V3L4 14h7v7l9-11h-7z" }))),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h1", { className: "text-lg font-semibold text-white" }, " Colab AI Assistant ")),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "space-y-4 mb-4 max-h-96 overflow-y-auto" }, messages.map(function (message, index) { return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { key: index, className: "flex ".concat(message.type === 'user' ? 'justify-end' : 'justify-start') },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "flex gap-2 max-w-[85%] ".concat(message.type === 'user' ? 'flex-row-reverse' : 'flex-row') },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "flex-shrink-0 ".concat(message.type === 'ai' ? 'bg-orange-600' : 'bg-gray-600', " rounded-full p-2 h-8 w-8 flex items-center justify-center") }, message.type === 'ai' ? (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("svg", { className: "w-4 h-4 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M13 10V3L4 14h7v7l9-11h-7z" }))) : (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(lucide_react__WEBPACK_IMPORTED_MODULE_3__["default"], { className: "w-4 h-4 text-white" }))),
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "p-3 rounded-lg ".concat(message.type === 'user'
                                ? 'bg-orange-600 text-white'
                                : 'bg-gray-800 text-gray-100') },
                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", { className: "text-sm" }, message.content))))); }))),
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "space-y-4" },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "space-y-2" },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("textarea", { id: "prompt", placeholder: "Enter your prompt here...", className: "w-full h-32 px-3 py-2 text-sm text-gray-100 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors resize-none bg-gray-800" })),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "space-y-2" },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("select", { id: "model", className: "w-full px-3 py-2 text-sm text-gray-100 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-gray-800 cursor-pointer" },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", { value: "gpt-4o-mini" }, "GPT-4o Mini"))),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "flex space-x-2" },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", { className: "flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2" },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("svg", { className: "w-5 h-5 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 5l7 7-7 7" })),
                        "Send"))))));
};
_a = App;
__webpack_require__.$Refresh$.register(_a, "App");
_b(App, "rF80BMBPURuDujSIsEuF77sIoUo=");
function applyOperations(content) {
    var operations = (0,_parser__WEBPACK_IMPORTED_MODULE_1__.parseContent)(content);
    var _loop_1 = function (i) {
        setTimeout(function () {
            var operation = operations[i];
            if (operation.type === 'create') {
                insertCell(operation.content, operation.cellType, operation.position);
            }
            else if (operation.type === 'edit') {
                updateCell(operation.cellId, operation.content);
            }
            else if (operation.type === 'delete') {
                deleteCell(operation.cellId);
            }
            else {
                console.error('Invalid operation type');
            }
        }, 1000 * i); // Delay to allow for cell creation
    };
    for (var i = 0; i < operations.length; i++) {
        _loop_1(i);
    }
}
function insertCell(content, type, position) {
    var atIndex = getCellIndexFromRelativePosition(position);
    if (atIndex === -1) {
        console.error('Invalid position');
        return;
    }
    var notebook = document.querySelector('colab-shaded-scroller');
    if (!notebook) {
        console.error('Notebook element not found');
        return;
    }
    var lastCell = notebook.querySelector(".notebook-cell-list > :nth-child(".concat(atIndex, ")"));
    if (!lastCell) {
        console.error('Cell not found');
        return;
    }
    var addButtonGroup = atIndex === 0 ? notebook.querySelector('.add-cell') : lastCell.querySelector('.add-cell');
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
    var addButton = addButtonGroup.querySelector(type === 'code' ? '.add-code' : '.add-text');
    addButton.click();
    // get the newly created cell
    var newCell = notebook.querySelector('.notebook-cell-list > :nth-child(' + (atIndex + 1) + ')');
    if (!newCell) {
        console.error('New cell not found');
        return;
    }
    var id = newCell.getAttribute('id');
    // Use a custom event to pass data to the page context
    setTimeout(function () {
        var customEvent = new CustomEvent('setMonacoValue', {
            detail: { id: id, content: content, type: type }
        });
        document.dispatchEvent(customEvent);
    }, 500); // Increased timeout to allow for cell creation
}
function updateCell(id, newContent) {
    var customEvent = new CustomEvent('setMonacoValue', {
        detail: { id: id, content: newContent }
    });
    document.dispatchEvent(customEvent);
}
function deleteCell(id) {
    var customEvent = new CustomEvent('deleteCell', { detail: { id: id } });
    document.dispatchEvent(customEvent);
}
function requestContent(callback) {
    function handleContentEvent(event) {
        document.removeEventListener('contentValue', handleContentEvent);
        callback(event.detail.content);
    }
    document.addEventListener('contentValue', handleContentEvent);
    var customEvent = new CustomEvent('getContent');
    document.dispatchEvent(customEvent);
}
function getCellIndexFromRelativePosition(position) {
    var notebook = document.querySelector('colab-shaded-scroller');
    if (!notebook) {
        console.error('Notebook element not found');
        return -1;
    }
    var cells = notebook.querySelectorAll('.cell');
    if (position === 'top') {
        return 0;
    }
    else if (position === 'bottom') {
        return cells.length;
    }
    else if (position.startsWith('after:')) {
        var id_1 = position.split(':')[1];
        var index = Array.from(cells).findIndex(function (cell) { return cell.getAttribute('id') === id_1; });
        return index + 1;
    }
    else if (position.startsWith('before:')) {
        var id_2 = position.split(':')[1];
        var index = Array.from(cells).findIndex(function (cell) { return cell.getAttribute('id') === id_2; });
        return index;
    }
    else {
        return -1;
    }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (App);


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
/******/ 	__webpack_require__.h = () => ("5b3dc5fc52c76a908342")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=contentScript.54d249e3e59c62c451c3.hot-update.js.map