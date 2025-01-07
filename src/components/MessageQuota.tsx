import React, { useEffect, useState } from 'react';
import { useAuthState } from '../utils/useAuthState';
import { subscriptionPlans } from '../utils/subscriptions';
import { AuthState } from '../utils/types';

export function MessageQuota({ messagesRemaining, freePlan }: { messagesRemaining: number, freePlan: boolean }) {

  return (
    <div className="flex items-center space-x-2 text-sm">
      <span className="text-gray-300">
        {freePlan ? `${messagesRemaining} messages left` : `${messagesRemaining} messages left today`}
      </span>
    </div>
  );
};
