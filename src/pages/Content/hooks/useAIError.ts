import { AIError, ErrorType } from '../../../../src/utils/errors';

export const useAIError = ( onError: (error: { type: ErrorType, message: string, action?: () => void, actionText?: string}) => void ) => {

    const handleAIError = (error: AIError) => {
        let errorMessage = 'An unexpected error occurred. Please try again.';
        let action = undefined;
        let actionText = undefined;

        switch (error.type) {
            case ErrorType.GENERATION_IN_PROGRESS:
                errorMessage = 'Please wait for the current generation to complete before starting a new one.';
                break;

            case ErrorType.RATE_LIMIT:
            case ErrorType.QUOTA_EXCEEDED:
                errorMessage = 'Too many requests or quota exceeded. Please wait a moment and try again.';
                break;

            case ErrorType.NETWORK:
                errorMessage = 'Network connection error. Please check your internet connection.';
                break;

            case ErrorType.AUTHENTICATION:
                errorMessage = error.message || 'Authentication failed. Please check your API key in the extension settings.';
                action = () => chrome.runtime.openOptionsPage();
                actionText = 'Open Settings';
                break;

            case ErrorType.CONFIGURATION:
                errorMessage = error.message || 'Configuration error. Please check your API key and model selection in the extension settings.';
                action = () => chrome.runtime.openOptionsPage();
                actionText = 'Open Settings';
                break;

            case ErrorType.MODEL_ACCESS:
                errorMessage = error.message || 'The selected model is not available with your API key. Please check your subscription or try a different model.';
                break;

            case ErrorType.INVALID_REQUEST:
                errorMessage = 'Invalid request. Please try rephrasing your message or try again.';
                break;

            case ErrorType.SERVER:
                errorMessage = error.message || 'Server error from AI provider. Please try again in a moment.';
                break;

            default:
                console.error('Unhandled error:', error);
                // If we have a specific error message, use it instead of the generic one
                if (error.message && error.message.trim()) {
                    errorMessage = error.message;
                }
        }

        onError({
            type: error.type,
            message: errorMessage,
            action,
            actionText
        });

    };
    
    return { handleAIError}
}