import { useState, useEffect } from "react";
import { AuthState } from "./types";

const DEFAULT_AUTH_STATE: AuthState = {
    user: null,
    session: null,
    subscriptionPlan: 'free',
    subscriptionDetails: null
};

export const useAuthState = () => {
    const [authState, setAuthState] = useState<AuthState>(DEFAULT_AUTH_STATE);

    useEffect(() => {
        // Listen for auth state changes
        const authListener = (message: any) => {
            if (message.type === 'AUTH_STATE_CHANGED') {
                setAuthState(message.payload);
            }
        };

        chrome.runtime.onMessage.addListener(authListener);

        // Cleanup listener
        return () => {
            chrome.runtime.onMessage.removeListener(authListener);
        };
    }, []);

    // Function to get current auth state
    async function refreshAuthState(global = false) {
        try {

            if (global) {
                const response = await chrome.runtime.sendMessage({
                    type: 'SUPABASE_REQUEST',
                    payload: {
                        operation: 'REFRESH_AUTH_STATE'
                    }
                });

                if (response.data) {
                    setAuthState(response.data);
                } else {
                    setAuthState(DEFAULT_AUTH_STATE);
                }
                return;
            }

            const response = await chrome.runtime.sendMessage({
                type: 'SUPABASE_REQUEST',
                payload: {
                    operation: 'GET_AUTH_STATE'
                }
            });

            if (response.data) {
                setAuthState(response.data);
            } else {
                setAuthState(DEFAULT_AUTH_STATE);
            }

        } catch (error) {
            console.error('Error getting auth state:', error);
            setAuthState(DEFAULT_AUTH_STATE);
            throw error;
        }
    }

    return {
        authState,
        refreshAuthState
    };
};