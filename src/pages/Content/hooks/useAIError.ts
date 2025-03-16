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
                errorMessage = 'Too many requests. Please wait a moment and try again.';
                break;

            case ErrorType.NETWORK:
                errorMessage = 'Network connection error. Please check your internet connection.';
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