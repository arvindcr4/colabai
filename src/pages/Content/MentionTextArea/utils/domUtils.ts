export function getCaretPosition(selection: Selection): DOMRect {
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  // Get the editor element (assuming it's the closest contenteditable or textarea)
  const editor = (range.startContainer as Element).closest?.('[contenteditable="true"]') || 
                (range.startContainer.parentElement?.closest?.('[contenteditable="true"]'));
                
  if (editor) {
    // Get the editor's position
    const editorRect = editor.getBoundingClientRect();
    // Calculate position relative to the editor
    return new DOMRect(
      rect.left - editorRect.left,
      rect.top - editorRect.top,
      rect.width,
      rect.height
    );
  }
  
  return rect;
}

export function insertActionAtCursor(node: Node, range?: Range | null) {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;

  range = range || selection.getRangeAt(0);
  
  // If we're in the middle of typing an @mention, remove the partial text
  const text = range.startContainer.textContent || '';
  const startPos = range.startOffset;
  
  // Find the start of the @mention
  let atPos = startPos;
  while (atPos > 0 && text[atPos - 1] !== '@') {
    atPos--;
  }
  
  // Create a new range to delete the @mention text
  const newRange = document.createRange();
  newRange.setStart(range.startContainer, Math.max(0, atPos - 1));
  newRange.setEnd(range.startContainer, startPos);
  newRange.deleteContents();
  
  // Insert the mention node
  range.insertNode(node);
  
  // Move cursor to end and add a space
  const space = document.createTextNode('\u00A0');
  range.setStartAfter(node);
  range.setEndAfter(node);
  range.insertNode(space);
  
  // Set cursor after the space
  range.setStartAfter(space);
  range.setEndAfter(space);
  selection.removeAllRanges();
  selection.addRange(range);
}