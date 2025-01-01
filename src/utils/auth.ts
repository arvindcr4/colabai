import { AuthState } from '../utils/types';

// Function to update auth state
export async function updateAuthState(authState: AuthState) {
  try {
    // Send to all extension components
    chrome.runtime.sendMessage({ 
      type: 'AUTH_STATE_CHANGED', 
      payload: authState 
    });

    // Send to all content scripts in all tabs
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, { 
            type: 'AUTH_STATE_CHANGED', 
            payload: authState 
          });
        } catch (err) {
          // Ignore errors for tabs that don't have the content script
          console.debug('Could not send auth state to tab:', tab.id);
        }
      }
    }
  } catch (error) {
    console.error('Error updating auth state:', error);
  }
}



export async function signInWithGoogle() {
  const response = await chrome.runtime.sendMessage({
    type: 'SUPABASE_REQUEST',
    payload: {
      operation: 'SIGN_IN_WITH_GOOGLE'
    }
  });

  if (response.data?.url) {
    await chrome.runtime.sendMessage({
      action: "signInWithGoogle",
      payload: { url: response.data.url }
    });
  }
}