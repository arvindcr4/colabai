import { AIError, ErrorType } from '../../../../src/utils/errors';

export const useAIError = ( openSubscriptionWindow: () => void, onError: (error: { type: ErrorType, message: string, action?: () => void, actionText?: string}) => void ) => {

    const handleAIError = (error: AIError) => {
        let errorMessage = 'An unexpected error occurred. Please try again.';
        let action = undefined;
        let actionText = undefined;

        switch (error.type) {
            case ErrorType.AUTHENTICATION:
                errorMessage = 'Please sign in to continue.';
                break;

            case ErrorType.QUOTA_EXCEEDED:
                errorMessage = 'You have reached your daily message limit.';
                action = () => openSubscriptionWindow();
                actionText = 'Upgrade';
                break;

            case ErrorType.MODEL_ACCESS:
                errorMessage = error.message || 'Your current plan does not have access to this model.';
                action = () => openSubscriptionWindow();
                actionText = 'Upgrade';
                break;

            case ErrorType.RATE_LIMIT:
                errorMessage = 'Too many requests. Please wait a moment and try again.';
                break;

            case ErrorType.NETWORK:
                errorMessage = 'Network connection error. Please check your internet connection.';
                break;

            case ErrorType.SERVER:
                errorMessage = 'Server error. Please try again later.';
                if (error.details?.status === 503) {
                    errorMessage = 'Service is temporarily unavailable. Please try again later.';
                }
                break;

            default:
                console.error('Unhandled error:', error);
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