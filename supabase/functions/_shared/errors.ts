const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, X-Messages-Remaining',
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE"
}

export enum ErrorType {
    AUTHENTICATION = 'AUTHENTICATION',
    QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
    MODEL_ACCESS = 'MODEL_ACCESS',
    RATE_LIMIT = 'RATE_LIMIT',
    NETWORK = 'NETWORK',
    SERVER = 'SERVER',
    UNKNOWN = 'UNKNOWN',
    GENERATION_IN_PROGRESS = 'generation_in_progress'
  }

// Error status codes
export const errorStatusCodes: Record<ErrorType, number> = {
    [ErrorType.AUTHENTICATION]: 401,
    [ErrorType.QUOTA_EXCEEDED]: 429,
    [ErrorType.MODEL_ACCESS]: 403,
    [ErrorType.RATE_LIMIT]: 429,
    [ErrorType.NETWORK]: 500,
    [ErrorType.SERVER]: 500,
    [ErrorType.UNKNOWN]: 500,
    [ErrorType.GENERATION_IN_PROGRESS]: 500
  };
  
  export interface AIError {
    type: ErrorType;
    message: string;
    details?: any;
  }
  
  export class AIServiceError extends Error {
    constructor(public error: AIError) {
      super(error.message);
      this.name = 'AIServiceError';
    }
  }
  
  export function isAIServiceError(error: any): error is AIServiceError {
    return error instanceof AIServiceError;
  }
  
  export function createErrorResponse(errorType: ErrorType, message: string, details?: any): Response {
    return new Response(JSON.stringify({
        error: {
          type: errorType,
          message,
          details
        }
      }), {
        status: errorStatusCodes[errorType],
        headers: corsHeaders
      });
  }