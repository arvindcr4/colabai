export enum ErrorType {
  UNKNOWN = 'unknown',
  NETWORK = 'network',
  SERVER = 'server',
  AUTHENTICATION = 'authentication',
  INVALID_REQUEST = 'invalid_request',
  QUOTA_EXCEEDED = 'quota_exceeded',
  MODEL_ACCESS = 'model_access',
  CONFIGURATION = 'configuration',
  GENERATION_IN_PROGRESS = 'generation_in_progress',
  RATE_LIMIT = 'rate_limit'
}

export interface AIError {
  type: ErrorType;
  message: string;
  details?: any;
}

export class AIServiceError extends Error implements AIError {
  type: ErrorType;
  details?: any;

  constructor(error: AIError) {
    super(error.message);
    this.type = error.type;
    this.details = error.details;
    this.name = 'AIServiceError';
  }
}

export function isAIServiceError(error: any): error is AIServiceError {
  return error instanceof AIServiceError;
}