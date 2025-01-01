import React, { useEffect, useState } from 'react';
import { subscriptionPlans, createSubscription } from '../../utils/subscriptions';
import { SubscriptionPlan } from '../../utils/types';
import { useAuthState } from '../../utils/useAuthState';

const SubscriptionPopup: React.FC = () => {
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);

  const { authState, refreshAuthState } = useAuthState();

  useEffect(() => {
    refreshAuthState().finally(() => {
      setLoading(false);
    });
  }, []);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (plan.id === 'free' || plan.id === 'pro') {
      return;
    }

    try {
      setLoadingPayment(true);
      setError(null);

      const approvalUrl = await createSubscription(plan);
      window.location.href = approvalUrl;
    } catch (error: any) {
      console.error('Subscription error:', error);
      setError('Failed to create subscription. Please try again.');
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!authState.subscriptionDetails?.paypal_subscription_id) {
      setError('No active subscription found');
      return;
    }

    try {
      setCancellingSubscription(true);
      setError(null);

      await chrome.runtime.sendMessage({
        type: 'SUPABASE_REQUEST',
        payload: {
          operation: 'CANCEL_SUBSCRIPTION',
          data: {
            subscriptionId: authState.subscriptionDetails.paypal_subscription_id
          }
        }
      });

      await refreshAuthState();
      window.close();
    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      setError('Failed to cancel subscription. Please try again.');
    } finally {
      setCancellingSubscription(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-800 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl border border-orange-600/20">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-100">Loading...</h2>
            <div className="animate-spin h-5 w-5 border-b-2 border-gray-100"></div>
          </div>
        </div>
      </div>
    );
  }

  if (authState.subscriptionPlan !== 'free') {
    return (
      <div className="fixed inset-0 bg-gray-800 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl border border-orange-600/20">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-100">Current Plan: {authState.subscriptionPlan}</h2>
                <p className="text-gray-400 mt-1">
                  You have an active subscription. Would you like to cancel it?
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleCancelSubscription}
                disabled={cancellingSubscription}
                className={`px-4 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 transition-colors ${cancellingSubscription ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                {cancellingSubscription ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-900/50 text-red-400 rounded-lg border border-red-500/20">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-800 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl border border-orange-600/20">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-100">Choose Your Plan</h2>
              <p className="text-gray-400 mt-1">
                Select the plan that best fits your needs
              </p>
            </div>

          </div>

          {error && (
            <div className="p-4 bg-red-900/50 text-red-400 rounded-lg border border-red-500/20">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subscriptionPlans.map((plan) => (
              <div
                key={plan.id}
                className={`flex relative rounded-xl p-6 transition-all ${plan.popular
                  ? 'border-2 border-orange-600 shadow-lg scale-105 bg-gray-800'
                  : 'border border-gray-700 hover:border-orange-600/50 hover:shadow-md bg-gray-800/50'
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-orange-600 text-white text-sm px-3 py-1 rounded-full shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="flex flex-col flex-1 justify-between space-y-4">
                  <div className='space-y-4'>
                    <div>
                      <h3 className="text-xl font-bold text-gray-100">{plan.name}</h3>
                      <p className="text-gray-400 mt-1">{plan.description}</p>
                    </div>

                    <div className="text-center">
                      <span className="text-4xl font-bold text-gray-100">
                        ${plan.priceUSD}
                      </span>
                      <span className="text-gray-400">/month</span>
                    </div>

                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-gray-300">
                          <svg
                            className="w-5 h-5 text-orange-600 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>

                  </div>

                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={loadingPayment || plan.id === 'free' || plan.id === 'pro'}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${plan.popular
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : plan.id === 'free' || plan.id === 'pro'
                        ? 'bg-gray-700 text-gray-300'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } ${loadingPayment ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loadingPayment
                      ? 'Processing...'
                      : plan.id === 'free'
                        ? 'Current Plan'
                        : plan.id === 'pro' ? 'Coming Soon..' : 'Subscribe with PayPal'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPopup;
