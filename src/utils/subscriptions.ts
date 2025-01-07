import { type SubscriptionPlan, type ModelType } from '../../supabase/functions/_shared/subscription-plans';

export { subscriptionPlans } from '../../supabase/functions/_shared/subscription-plans'; 

export async function createSubscription(plan: SubscriptionPlan) {
  // Create a popup window for the payment
  const width = 500;
  const height = 600;
  const left = window.screen.width / 2 - width / 2;
  const top = window.screen.height / 2 - height / 2;

  const response = await chrome.runtime.sendMessage({
    type: 'SUPABASE_REQUEST',
    payload: {
      operation: 'INVOKE_FUNCTION',
      functionName: 'payment',
      functionData: {
        planId: plan.id,
        successUrl: chrome.runtime.getURL('payment-success.html'),
        cancelUrl: chrome.runtime.getURL('payment-cancel.html')
      }
    }
  });

  if (!response || response.error) {
    throw new Error(response?.error || 'Failed to create subscription');
  }

  // Open PayPal in a popup window
  const paypalWindow = window.open(
    response.data.approvalUrl,
    'PayPal',
    `width=${width},height=${height},left=${left},top=${top}`
  );

  if (!paypalWindow) {
    throw new Error('Popup was blocked. Please allow popups for this site.');
  }

  // Return the window reference so we can handle the result
  return paypalWindow;
}

export async function activateSubscription(subscriptionId: string) {
  const response = await chrome.runtime.sendMessage({
    type: 'SUPABASE_REQUEST',
    payload: {
      operation: 'ACTIVATE_SUBSCRIPTION',
      data: {
        subscriptionId
      }
    }
  });

  return response.data.data.isActive;
}