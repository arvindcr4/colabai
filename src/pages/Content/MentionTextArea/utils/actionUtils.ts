import { ActionData } from '../types';

export function createActionNode(action: ActionData) {
  const actionNode = document.createElement('span');
  actionNode.className = 'action-pill inline-flex items-center px-2 py-0.5 rounded-full text-sm font-medium bg-orange-600 text-white mx-1';
  actionNode.contentEditable = 'false';
  actionNode.setAttribute('data-action-id', action.id);
  actionNode.textContent = `@${action.label}`;
  return actionNode;
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