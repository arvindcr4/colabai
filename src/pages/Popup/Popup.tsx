import React, { useEffect, useState } from 'react';
import '../../styles.css';
import { AuthTokenResponse } from '@supabase/supabase-js';
import { useAuthState } from '../../utils/useAuthState';
import { AuthState } from '../../utils/types';

const manifest = chrome.runtime.getManifest();

const url = new URL('https://accounts.google.com/o/oauth2/auth');

if (manifest && manifest.oauth2 && manifest.oauth2.scopes) {
  url.searchParams.set('client_id', manifest.oauth2.client_id);
  url.searchParams.set('response_type', 'id_token');
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('redirect_uri', `https://${chrome.runtime.id}.chromiumapp.org/`);
  url.searchParams.set('scope', manifest.oauth2.scopes.join(' '));
}

const Popup = () => {
  const { authState, refreshAuthState } = useAuthState();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial auth check
    refreshAuthState().then(() => {
      setLoading(false);
    }).catch((error) => {
      setError('Failed to check authentication status');
      setLoading(false);
    });
  }, []);

  const handleSignOut = async () => {
    try {

      setLoading(true);
      setError(null);
      await signOut();
      setLoading(false);

    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out');
      setLoading(false);
    }
  };

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    try {
      await chrome.identity.launchWebAuthFlow(
        {
          url: url.href,
          interactive: true,
        },
        async (redirectedTo) => {
          if (chrome.runtime.lastError) {
            console.error('Auth Error:', chrome.runtime.lastError);
            setError('Failed to authenticate with Google');
            setLoading(false);
            return;
          }

          try {
            const url = new URL(redirectedTo || '');
            const params = new URLSearchParams(url.hash.substring(1));

            const idToken = params.get('id_token');
            if (!idToken) {
              setError('Failed to authenticate with Google');
              setLoading(false);
              return;
            }

            const response = await chrome.runtime.sendMessage({
              type: 'SUPABASE_REQUEST',
              payload: {
                operation: 'SIGN_IN_WITH_GOOGLE',
                data: {
                  token: idToken,
                }
              },
            });

            if (response.error) {
              setError(response.error.message);
              setLoading(false);
              return;
            }

          } catch (error) {
            console.error('Error in auth flow:', error);
            setError('Authentication failed');
          } finally {
            setLoading(false);
          }
        }
      );
    } catch (error) {
      console.error('Error launching auth flow:', error);
      setError('Failed to start authentication');
      setLoading(false);
    }
  }

  // Function to clear auth state (logout)
  async function signOut() {
    try {
      // First sign out from Supabase
      await chrome.runtime.sendMessage({
        type: 'SUPABASE_REQUEST',
        payload: {
          operation: 'SIGN_OUT'
        }
      });

      // Clear session from storage in all contexts
      await chrome.storage.local.remove(['sb-*', 'session']); // Clear all Supabase-related storage

    } catch (error) {
      console.error('Error clearing auth state:', error);
      throw error;
    }
  }

  if (loading) {
    return (
      <div className="w-[350px] min-h-[300px] bg-gray-900 text-gray-100 p-6 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-orange-600"></div>
          <span className="text-gray-300">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-[350px] min-h-[300px] bg-gray-900 text-gray-100 p-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500">{error}</div>
          <button
            onClick={refreshAuthState}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[350px] min-h-[300px] bg-gray-900 text-gray-100 p-6">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gray-800 p-2 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <h1 className="text-xl font-semibold">ColabAI</h1>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {authState.user ? (
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-700 p-2 rounded-full">
                    {authState.user.user_metadata?.avatar_url ? (
                      <img
                        src={authState.user.user_metadata.avatar_url}
                        alt="Profile"
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{authState.user.user_metadata?.name || 'User'}</p>
                    <p className="text-sm text-gray-400">{authState.user.email}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-gray-800 
                         border border-gray-700 rounded-lg hover:bg-gray-700 
                         focus:outline-none focus:ring-2 focus:ring-orange-500 
                         focus:ring-offset-2 focus:ring-offset-gray-900 
                         transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-6 py-8">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">Welcome Back</h2>
                <p className="text-gray-400 text-sm">Sign in to access all features</p>
              </div>

              <button
                onClick={signInWithGoogle}
                className="w-full px-4 py-3 text-sm font-medium text-white bg-orange-600 
                         rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 
                         focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900 
                         transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-800">
          <p className="text-xs text-center text-gray-500">
            Powered by ColabAI Assistant
          </p>
        </div>
      </div>
    </div>
  );
};

export default Popup;
