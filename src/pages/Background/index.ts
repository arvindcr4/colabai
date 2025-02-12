
import { createClient, Session, User } from '@supabase/supabase-js';
import { generateAIContent, restartAI } from './ai-agent';
import { AuthState } from '../../utils/types';
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from "@supabase/supabase-js";
import { ErrorType, type AIError } from '../../utils/errors';

// @ts-ignore
import secrets from 'secrets';

const supabase = createClient(secrets.SUPABASE_URL, secrets.SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: {
      getItem: async (key) => {
        const { [key]: value } = await chrome.storage.local.get(key);
        return value;
      },
      setItem: async (key, value) => {
        await chrome.storage.local.set({ [key]: value });
      },
      removeItem: async (key) => {
        await chrome.storage.local.remove(key);
      }
    }
  }
});

// // Initialize session from storage
// (async () => {
//   const { data: { session }, error } = await supabase.auth.getSession();
//   if (session) {
//     const authState = await getUserAuthState(session);
//     await updateAuthState(authState);
//   }
// })();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const { action, type } = request;

    if (type === 'SUPABASE_REQUEST') {
        handleSupabaseRequest(request.payload)
            .then((result) => {
                sendResponse({ success: true, data: result });
            })
            .catch((error) => {
                console.error('Error in handleSupabaseRequest:', error);
                sendResponse({ 
                    success: false, 
                    error: error
                });
            });
        return true;  // Indicate we will send response asynchronously
    }

    if (type === 'UPDATE_SUBSCRIPTION_PLAN') {
        // Broadcast the subscription plan update to all tabs
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, {
                type: 'SUBSCRIPTION_PLAN_UPDATED',
                payload: request.payload
              });
            }
          });
        });
        sendResponse({ success: true });
        return true;
    }

    switch (action) {
        case 'generateAI':
            console.log("Generating...");
            generateAIContent(request.prompt, request.content, supabase, request.model, request.plan)
                .then(() => {
                    sendResponse({ success: true });
                })
                .catch((error) => {
                    console.error('Error generating AI content:', error);
                    sendResponse({ success: false, error });
                });
            return true;
        case 'restartAI':
            console.log("Restarting...");
            restartAI();
            sendResponse({ success: true });
            return true;

        case 'OPEN_POPUP':
            const { popupUrl, width, height, left, top } = request.payload;
            chrome.windows.create({
                url: popupUrl,
                type: 'popup',
                width,
                height,
                left: left,
                top: top
            });
            sendResponse({ success: true });
            return true;

        default:
            sendResponse({ success: false, error: `Invalid action: ${action}` });
            return false;
    }
});

async function getSubscriptionDetails(userId: string) {
  
  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('profile_id', userId)
    .in('status', ['active', 'pending_activation'])
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
  
  return subscriptions?.[0] || null;
}

async function handleSupabaseRequest(payload: any) {
  const { operation, functionName, functionData, data } = payload;
  
  switch (operation) {
    case 'GET_AUTH_STATE':
      {
      const authResponse = await supabase.auth.getSession();

      if (!authResponse.data.session) {
        return { user: null, session: null, subscriptionPlan: 'free' };
      }

      return await getUserAuthState(authResponse.data.session);
      }
    case 'REFRESH_AUTH_STATE': // Refresh auth state across the extension
      {
        const authResponse = await supabase.auth.getSession();

        if (!authResponse.data.session) {
          return { user: null, session: null, subscriptionPlan: 'free' };
        }
  
        const authState = await getUserAuthState(authResponse.data.session);

        await updateAuthState(authState);
        return authState;
      }
    case 'SIGN_IN_WITH_GOOGLE':
      {
      const response =  await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: data.token,
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
          
        } as any,
      });

      return response;
      }
    case 'SIGN_OUT':
      await supabase.auth.signOut();
      await chrome.storage.local.clear(); // Clear all storage
      return await updateAuthState({
        user: null,
        session: null,
        subscriptionPlan: 'free',
        subscriptionDetails: null
      });
    
    case 'INVOKE_FUNCTION':
      {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('User must be logged in to perform this action');
      }

      const { data: functionResponse, error } = await supabase.functions.invoke(
        functionName,
        {
          body: functionData,
          headers: {
            Authorization: `Bearer ${session.data.session.access_token}`
          }
        }
      );

      
      if (error instanceof FunctionsHttpError) {
        const errorMessage = await error.context.json()
        console.error('Supabase function error:', errorMessage);
        throw errorMessage.error;
    } else if (error instanceof FunctionsRelayError) {
        throw {
            type: ErrorType.SERVER,
            message: 'Error during content streaming',
            details: error
        };
    } else if (error instanceof FunctionsFetchError) {
        throw {
            type: ErrorType.SERVER,
            message: 'Error during content streaming',
            details: error
        };
    }

      return functionResponse;
    }
    case 'ACTIVATE_SUBSCRIPTION': // Check if subscription is active after payment
      {
      const { subscriptionId } = data;
      return await supabase.functions.invoke(`payment?subscription_id=${subscriptionId}`, {
        method: 'GET'
      });
      }
    case 'CANCEL_SUBSCRIPTION':
      {
        const { subscriptionId } = data;
        if (!subscriptionId) {
          throw new Error('Subscription ID is required');
        }

        const session = await supabase.auth.getSession();
        if (!session.data.session?.access_token) {
          throw new Error('User must be logged in');
        }

        const response = await supabase.functions.invoke('payment', {
          method: 'DELETE',
          body: { subscriptionId }
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        // Refresh auth state after cancellation
        const authState = await getUserAuthState(session.data.session);
        await updateAuthState(authState);

        return { success: true };
      }
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

async function updateAuthState(authState: AuthState) {
  // Send to all extension components
  chrome.runtime.sendMessage({ 
    type: 'AUTH_STATE_CHANGED', 
    payload: authState 
  });

  // Notify content scripts
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'AUTH_STATE_CHANGED',
        payload: authState
      }).catch(err => {
        // Ignore errors from inactive tabs
        console.debug('Failed to send message to tab:', tab.id, err);
      });
    }
  }
}

supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN') {
    if (!session?.user) {
      throw new Error('User is not defined');
    }

    const authState = await getUserAuthState(session);
    await updateAuthState(authState);
  }

  if (event === 'SIGNED_OUT') {
    await updateAuthState({
      user: null,
      session: null,
      subscriptionPlan: 'free',
      subscriptionDetails: null
    });
  }

  if (event === 'USER_UPDATED') {
    if (!session?.user) {
      throw new Error('User is not defined');
    }

    const authState = await getUserAuthState(session);
    await updateAuthState(authState);
  }
});

async function getUserAuthState(session: Session): Promise<AuthState> {
  const user = session?.user as User;

  let subscriptionDetails = null;
  let subscriptionPlan = 'free';

  if (user.id) {
    subscriptionDetails = await getSubscriptionDetails(user.id);
    if (subscriptionDetails) {
      subscriptionPlan = subscriptionDetails.plan_id;
    }
  }
  
  const authState = {
    user,
    session,
    subscriptionPlan,
    subscriptionDetails
  };

  return authState;
}

export { }

chrome.commands.onCommand.addListener(command => {
  
  if (command === 'refresh_extension') {
    chrome.runtime.reload()
  }
})

chrome.action.onClicked.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const activeTab = tabs[0]
    chrome.tabs.sendMessage(activeTab.id!, { message: 'clicked_browser_action' })
  })
})

chrome.runtime.onInstalled.addListener(async () => {
})

// chrome.action.setBadgeText({ text: 'ON' })
