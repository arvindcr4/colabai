import React, { useEffect, useState } from 'react';
import { useAuthState } from '../utils/useAuthState';
import { subscriptionPlans } from '../utils/subscriptions';
import { AuthState } from '../utils/types';

export function MessageQuota({ messagesRemaining }: { messagesRemaining: number }) {

  return (
    <div className="flex items-center space-x-2 text-sm">
      <span className="text-gray-300">
        {messagesRemaining} messages left today
      </span>
    </div>
  );
};
