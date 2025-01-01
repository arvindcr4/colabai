export function getCaretPosition(selection: Selection): DOMRect {
  const range = selection.getRangeAt(0);
  return range.getBoundingClientRect();
}

export function insertActionAtCursor(node: Node) {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  
  // If we're in the middle of typing an @mention, remove the partial text
  const text = range.startContainer.textContent || '';
  const startPos = range.startOffset;
  
  // Find the start of the @mention
  let atPos = startPos;
  while (atPos > 0 && text[atPos - 1] !== '@') {
    atPos--;
  }
  
  if (atPos > 0 && text[atPos - 1] === '@') {
    const newRange = document.createRange();
    newRange.setStart(range.startContainer, atPos - 1);
    newRange.setEnd(range.startContainer, startPos);
    newRange.deleteContents();
    range.setStart(range.startContainer, atPos - 1);
  }
  
  range.insertNode(node);
  
  // Move cursor to end
  range.setStartAfter(node);
  range.setEndAfter(node);
  selection.removeAllRanges();
  selection.addRange(range);
}

export function removeAction(actionElement: HTMLElement) {
  const parent = actionElement.parentElement;
  if (!parent) return;

  const range = document.createRange();
  range.selectNode(actionElement);
  range.deleteContents();

  // Ensure there's always a space where the mention was
  const space = document.createTextNode(' ');
  range.insertNode(space);

  // Move cursor to where the mention was
  const selection = window.getSelection();
  if (selection) {
    range.setStartAfter(space);
    range.setEndAfter(space);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}