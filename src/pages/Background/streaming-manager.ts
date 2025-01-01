import { StreamingState } from '../Content/hooks/useStreamingState';
import { parseLines } from '../Content/parser';
import { NotebookCell } from '../../utils/types';

export class StreamingManager {
    private streamingState: StreamingState;
    private port: chrome.runtime.Port | null = null;

    constructor() {
        this.streamingState = {
            buffer: '',
            fullResponse: '',
            textContent: '',
            isCodeBlock: false,
            appliedOperations: new Map(),
            currentOperations: new Map(),
            originalContent: []
        };

        // Listen for port connections from content scripts
        chrome.runtime.onConnect.addListener((port) => {
            if (port.name === 'streaming') {
                this.port = port;
                this.setupPortListeners(port);
            }
        });
    }

    private setupPortListeners(port: chrome.runtime.Port) {
        port.onMessage.addListener((msg) => {
            switch (msg.type) {
                case 'init_streaming':
                    this.initializeStreaming(msg.originalContent);
                    break;
                case 'process_chunk':
                    this.processStreamChunk(msg.content, msg.done);
                    break;
            }
        });

        port.onDisconnect.addListener(() => {
            this.port = null;
            this.resetState();
        });
    }

    private initializeStreaming(originalContent: NotebookCell[]) {
        this.streamingState = {
            buffer: '',
            fullResponse: '',
            textContent: '',
            isCodeBlock: false,
            appliedOperations: new Map(),
            currentOperations: new Map(),
            originalContent
        };
    }

    private processStreamChunk(content: string, done: boolean) {
        if (!content || !this.port) return;

        // Add content to buffer and process lines
        const lines = (this.streamingState.buffer + content).split('\n');
        this.streamingState.buffer = lines.pop() || '';

        if (lines.length > 0) {
            const nextState = parseLines(this.streamingState, lines);
            this.streamingState = nextState;

            // Send operations to content script
            for (const [id, operation] of nextState.currentOperations) {
                this.port.postMessage({
                    type: 'operation',
                    operation
                });
            }

            // If done, send all applied operations
            if (done) {
                this.port.postMessage({
                    type: 'complete',
                    operations: Array.from(nextState.appliedOperations.entries())
                });
            }
        }
    }

    private resetState() {
        this.streamingState = {
            buffer: '',
            fullResponse: '',
            textContent: '',
            isCodeBlock: false,
            appliedOperations: new Map(),
            currentOperations: new Map(),
            originalContent: []
        };
    }
}
