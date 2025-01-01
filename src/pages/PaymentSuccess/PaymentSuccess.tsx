import React, { useEffect, useState } from 'react';
import { useAuthState } from '../../utils/useAuthState';
import { activateSubscription } from '../../../src/utils/subscriptions';

export const PaymentSuccess = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const { authState, refreshAuthState } = useAuthState();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const subscriptionId = urlParams.get('subscription_id');

        if (!subscriptionId) {
          throw new Error('No subscription ID found');
        }

        // Poll for subscription status
        let attempts = 0;
        const maxAttempts = 3;
        const pollInterval = 2000; // 2 seconds

        while (attempts < maxAttempts) {
          const isActive = await activateSubscription(subscriptionId);

          if (isActive) {
            setStatus('success');
            await refreshAuthState(true);

            // Close window after short delay
            setTimeout(async () => {
              window.close();

            }, 2000);
            return;
          }

          await new Promise(resolve => setTimeout(resolve, pollInterval));
          attempts++;
        }

        // If we reach here, subscription is taking longer than expected
        setStatus('success');
        setError('Your subscription is being processed. You may close this window and continue using the extension. Please refresh the page.');
        await refreshAuthState();

        //setTimeout(() => window.close(), 4000);
      } catch (err: any) {
        setStatus('error');
        setError(err.message);
      }
    };

    verifyPayment();
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 text-center border border-orange-600/20">
        {status === 'loading' && (
          <>
            <div className="animate-spin w-8 h-8 border-b-2 border-orange-600 rounded-full mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-100 mb-2">Processing Payment</h2>
            <p className="text-gray-400">Please wait while we verify your subscription...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <svg className="w-16 h-16 text-orange-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h2 className="text-xl font-bold text-gray-100 mb-2">Payment Successful!</h2>
            {error ? (
              <p className="text-gray-400">{error}</p>
            ) : (
              <p className="text-gray-400">Your subscription is now active. This window will close automatically.</p>
            )}
          </>
        )}

        {status === 'error' && (
          <>
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <h2 className="text-xl font-bold text-gray-100 mb-2">Something went wrong</h2>
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => window.close()}
              className="mt-4 px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
};
