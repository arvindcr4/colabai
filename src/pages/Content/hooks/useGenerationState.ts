import { useReducer } from 'react';
import { generationReducer } from '../reducers/generationReducer';
    
export interface GenerationState {
    isGenerating: boolean;
    isDiffing: boolean;
    isUpdatingNotebook: boolean;
    error: string | null;
  }
  
export const useGenerationState = () => {
const [generationState, dispatch] = useReducer(generationReducer, {
    isGenerating: false,
    isDiffing: false,
    isUpdatingNotebook: false,
    error: null
});

return {
    generationState,
    dispatch
};
};