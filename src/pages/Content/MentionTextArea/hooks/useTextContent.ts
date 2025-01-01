import { useCallback } from 'react';

export function useTextContent() {
  const getTextContent = useCallback((node: Node, position: number) => {
    // If node is a text node, return its content
    if (node.nodeType === Node.TEXT_NODE) {
      return {
        text: node.textContent || '',
        position
      };
    }

    // If node is an element
    if (node.nodeType === Node.ELEMENT_NODE) {
      let text = '';
      let currentPosition = 0;
      const childNodes = Array.from(node.childNodes);

      for (const child of childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          text += child.textContent;
          currentPosition += (child.textContent?.length || 0);
        } else if ((child as Element).classList?.contains('action-pill')) {
          // Add a space for action pills to ensure proper text handling
          text += ' ';
          currentPosition += 1;
        }
      }

      return {
        text,
        position: Math.min(position, text.length)
      };
    }

    return {
      text: '',
      position: 0
    };
  }, []);

  return { getTextContent };
}