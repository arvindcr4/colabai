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

      const paypalWindow = await createSubscription(plan);

      // Monitor the popup window
      const checkWindow = setInterval(() => {
        if (paypalWindow.closed) {
          clearInterval(checkWindow);
          setLoadingPayment(false);
          refreshAuthState();
        }
      }, 500);

    } catch (error: any) {
      console.error('Subscription error:', error);
      setError(error.message || 'Failed to create subscription. Please try again.');
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
    const currentPlan = subscriptionPlans.find(p => p.id === authState.subscriptionPlan);

    return (
      <div className="fixed inset-0 bg-gray-800 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-gray-800">
          {/* Plan Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gray-800 mb-4">
              <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">
              {currentPlan?.name} Plan
            </h2>
            <p className="text-sm text-gray-400">
              Your subscription is active
            </p>
          </div>

          {/* Plan Features */}
          <div className="mb-6">
            <div className="space-y-3">
              {currentPlan?.features.map((feature, index) => (
                <div key={index} className="flex items-center text-gray-300">
                  <svg className="w-4 h-4 text-orange-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {error && (
              <div className="text-red-500 text-sm text-center mb-4">
                {error}
              </div>
            )}
            <button
              onClick={handleCancelSubscription}
              disabled={cancellingSubscription}
              className={`w-full px-3 py-2 text-sm font-medium text-red-600 bg-red-800/20 outline outline-1 outline-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors ${cancellingSubscription ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
              {cancellingSubscription ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Cancelling...
                </div>
              ) : (
                'Cancel Subscription'
              )}
            </button>
            <button
              onClick={() => window.close()}
              className="w-full px-3 py-2 text-sm font-medium text-orange-600 bg-gray-800/20 outline outline-1 outline-orange-600 rounded-lg hover:bg-orange-600 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-800 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl border border-gray-800">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-100">Choose Your Plan</h2>
              <p className="text-sm text-gray-400 mt-1">
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
                className={`flex relative rounded-lg p-6 transition-all ${plan.popular
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
                      <h3 className="text-lg font-bold text-gray-100">{plan.name}</h3>
                      <p className="text-sm text-gray-400 mt-1">{plan.description}</p>
                    </div>

                    <div className="text-center">
                      <span className="text-2xl font-bold text-gray-100">
                        ${plan.priceUSD}
                      </span>
                      <span className="text-sm text-gray-400">/month</span>
                    </div>

                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-gray-300">
                          <svg
                            className="w-4 h-4 text-orange-600 mr-2 flex-shrink-0"
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
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                  </div>

                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={loadingPayment || plan.id === 'free' || plan.id === 'pro'}
                    className={`w-full px-3 py-2 text-sm font-medium text-orange-600 bg-gray-800 outline outline-1 outline-orange-600 rounded-lg hover:bg-orange-600 hover:text-white transition-colors ${loadingPayment ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
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
