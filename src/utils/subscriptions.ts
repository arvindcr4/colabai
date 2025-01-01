import { type SubscriptionPlan, type ModelType } from '../../supabase/functions/_shared/subscription-plans';

export { subscriptionPlans } from '../../supabase/functions/_shared/subscription-plans'; 

export async function createSubscription(plan: SubscriptionPlan) {
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

  return response.data.approvalUrl; // PayPal approval URL
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