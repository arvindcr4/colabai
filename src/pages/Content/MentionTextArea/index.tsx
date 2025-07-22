import React, { ForwardedRef, forwardRef } from 'react';
import { ActionTextArea, ActionTextAreaRef } from './ActionTextArea';
import { ActionProvider } from './ActionContext';
import { TextAction } from './types';
import './style.css';

export const ActionTextAreaWrapper = forwardRef<ActionTextAreaRef, { 
  actions: TextAction[], 
  onInput: (text: string) => void,
  onSubmit?: () => void
}>((props, ref) => {
  return (
    <ActionProvider actions={props.actions}>
      <ActionTextArea ref={ref} onInput={props.onInput} onSubmit={props.onSubmit} />
    </ActionProvider>
  );
});