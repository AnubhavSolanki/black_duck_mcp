/**
 * Custom error classes for Black Duck MCP Server
 */

export class BlackDuckError extends Error {
  constructor(message: string, public statusCode?: number, public errorCode?: string) {
    super(message);
    this.name = 'BlackDuckError';
    Object.setPrototypeOf(this, BlackDuckError.prototype);
  }
}

class AuthenticationError extends BlackDuckError {
  constructor(message: string = 'Authentication failed. Please check your API token.') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

class NotFoundError extends BlackDuckError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with ID '${id}' not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ValidationError extends BlackDuckError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

class RateLimitError extends BlackDuckError {
  constructor(message: string = 'Rate limit exceeded. Please try again later.') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

class ServerError extends BlackDuckError {
  constructor(message: string = 'Black Duck server error occurred.') {
    super(message, 500, 'SERVER_ERROR');
    this.name = 'ServerError';
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

export class NetworkError extends BlackDuckError {
  constructor(message: string = 'Network error occurred while connecting to Black Duck.') {
    super(message, undefined, 'NETWORK_ERROR');
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Convert HTTP status code to appropriate error
 */
export function createErrorFromStatus(statusCode: number, message?: string, errorCode?: string): BlackDuckError {
  switch (statusCode) {
    case 401:
    case 403:
      return new AuthenticationError(message);
    case 404:
      return new NotFoundError(message || 'Resource', undefined);
    case 429:
      return new RateLimitError(message);
    case 400:
      return new ValidationError(message || 'Invalid request');
    case 500:
    case 502:
    case 503:
    case 504:
      return new ServerError(message);
    default:
      return new BlackDuckError(message || 'An error occurred', statusCode, errorCode);
  }
}

/**
 * Format error for MCP response
 */
export function formatErrorForMCP(error: unknown): string {
  if (error instanceof BlackDuckError) {
    return `${error.name}: ${error.message}`;
  }

  if (error instanceof Error) {
    return `Error: ${error.message}`;
  }

  return `Unknown error: ${String(error)}`;
}
