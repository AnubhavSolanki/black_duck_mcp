/**
 * Authentication utilities for Black Duck API
 */

import { ValidationError } from './errors.js';

/**
 * Validate API token format
 * Black Duck API tokens are typically long alphanumeric strings
 */
export function validateApiToken(token: string): void {
  if (!token || token.trim().length === 0) {
    throw new ValidationError('API token cannot be empty');
  }

  // Basic validation - check if token looks reasonable
  if (token.length < 10) {
    throw new ValidationError('API token appears to be invalid (too short)');
  }

  // Check for common placeholder values
  const placeholders = ['your-api-token', 'your-token', 'token-here', 'xxx', 'yyy'];
  if (placeholders.some(placeholder => token.toLowerCase().includes(placeholder))) {
    throw new ValidationError(
      'Please replace the placeholder API token with your actual Black Duck API token'
    );
  }
}

/**
 * Create authentication headers for Black Duck API
 */
export function createAuthHeaders(apiToken: string): Record<string, string> {
  validateApiToken(apiToken);

  return {
    'Authorization': `Bearer ${apiToken}`,
    'Accept': 'application/vnd.blackducksoftware.user-4+json',
  };
}

/**
 * Get content type header for specific Black Duck API endpoint
 */
export function getContentType(endpoint: string): string {
  // Default content types for different endpoint patterns
  if (endpoint.includes('/projects') && !endpoint.includes('/versions')) {
    return 'application/vnd.blackducksoftware.project-detail-5+json';
  }

  if (endpoint.includes('/versions')) {
    return 'application/vnd.blackducksoftware.project-detail-5+json';
  }

  if (endpoint.includes('/vulnerable-bom-components')) {
    return 'application/vnd.blackducksoftware.bill-of-materials-6+json';
  }

  if (endpoint.includes('/vulnerabilities')) {
    return 'application/vnd.blackducksoftware.vulnerability-4+json';
  }

  if (endpoint.includes('/components')) {
    return 'application/vnd.blackducksoftware.bill-of-materials-6+json';
  }

  // Default JSON content type
  return 'application/json';
}
