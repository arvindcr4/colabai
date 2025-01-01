import React from 'react';
import { TextAction } from './types';

interface ActionBlockProps {
  action: TextAction;
}

export function ActionBlock({ action }: ActionBlockProps) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mr-1"
      role="button"
      tabIndex={0}
    >
      @{action.label}
    </span>
  );
}