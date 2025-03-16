import { GenerationState } from '../hooks/useGenerationState';

export const generationReducer = (state: GenerationState, action: GenerationAction): GenerationState => {
    switch (action.type) {
    case 'start_generation':
        return {
        ...state,
        isGenerating: true,
        error: null
        };
    case 'finish_generation':
        return {
        ...state,
        isGenerating: false,
        isUpdatingNotebook: false
        };
    case 'start_update_notebook':
        return {
        ...state,
        isUpdatingNotebook: true
        };
    case 'finish_update_notebook':
        return {
        ...state,
        isUpdatingNotebook: false
        };
    case 'start_diffing':
        return {
        ...state,
        isDiffing: true
        };
    case 'finish_diffing':
        return {
        ...state,
        isDiffing: false
        };
    case 'error':
        return {
        ...state,
        isGenerating: false,
        isDiffing: false,
        isUpdatingNotebook: false,
        error: action.payload
        };
    case 'reset':
        return {
            ...state,
            isGenerating: false,
            isDiffing: false,
            isUpdatingNotebook: false,
            error: null
        };
    default:
        return state;
    }
};

export type GenerationAction =
    | { type: 'start_generation' }
    | { type: 'finish_generation' }
    | { type: 'start_update_notebook' }
    | { type: 'finish_update_notebook' }
    | { type: 'start_diffing' }
    | { type: 'finish_diffing' }
    | { type: 'error'; payload: string }
    | { type: 'reset' };