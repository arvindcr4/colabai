// FILE: src/pages/Content/App.test.tsx

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { handleStreamingContent } from './parser';

test('simulates a streamed response from the AI', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<App />);

    // Simulate user input
    const promptInput = getByPlaceholderText('Enter your prompt here...');
    fireEvent.change(promptInput, { target: { value: 'Explain binary search tree' } });

    // Simulate model selection
    const modelSelect = getByText('GPT-4o Mini');
    fireEvent.change(modelSelect, { target: { value: 'gpt-4o-mini' } });

    // Simulate clicking the send button
    const sendButton = getByText('Send');
    fireEvent.click(sendButton);

    // Simulate streaming response from AI
    const streamedContent = [
        'A binary search tree (BST) is a data structure',
        'where each node has at most two children, referred to as the left child and the right child.',
        '@CREATE[type=code, position=bottom]',
        'class Node:',
        '    def __init__(self, key):',
        '        self.left = None',
        '        self.right = None',
        '        self.val = key',
        '@END'
    ];

    for (const content of streamedContent) {
        handleStreamingContent(content, jest.fn(), jest.fn());
    }

    // Verify the streamed content is displayed
    await findByText('A binary search tree (BST) is a data structure');
    await findByText('class Node:');
    await findByText('def __init__(self, key):');
});
