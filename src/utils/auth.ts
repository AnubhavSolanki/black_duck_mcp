/**
 * Authentication utilities for Black Duck API
 */

import axios from "axios";
import { ValidationError } from "./errors.js";

/**
 * Validate API token format
 * Black Duck API tokens are typically long alphanumeric strings
 */
function validateApiToken(token: string): void {
  if (!token || token.trim().length === 0) {
    throw new ValidationError("API token cannot be empty");
  }

  // Basic validation - check if token looks reasonable
  if (token.length < 10) {
    throw new ValidationError("API token appears to be invalid (too short)");
  }

  // Check for common placeholder values
  const placeholders = [
    "your-api-token",
    "your-token",
    "token-here",
    "xxx",
    "yyy",
  ];
  if (
    placeholders.some((placeholder) =>
      token.toLowerCase().includes(placeholder),
    )
  ) {
    throw new ValidationError(
      "Please replace the placeholder API token with your actual Black Duck API token",
    );
  }
}

/**
 * Bearer token cache
 */
let cachedBearerToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Authenticate with Black Duck and get a Bearer token
 * Black Duck uses a two-step auth process:
 * 1. POST to /api/tokens/authenticate with API token
 * 2. Use returned Bearer token for subsequent requests
 */
export async function authenticateAndGetBearerToken(
  baseURL: string,
  apiToken: string,
  timeout: number = 30000,
): Promise<string> {
  validateApiToken(apiToken);

  // Return cached token if still valid (with 5 minute buffer)
  if (cachedBearerToken && Date.now() < tokenExpiry - 5 * 60 * 1000) {
    return cachedBearerToken;
  }

  try {
    const response = await axios.post(
      `${baseURL}/api/tokens/authenticate`,
      {},
      {
        headers: {
          Authorization: `token ${apiToken}`,
          Accept: "application/vnd.blackducksoftware.user-4+json",
        },
        timeout,
      },
    );

    const bearerToken = response.data.bearerToken;
    if (!bearerToken) {
      throw new ValidationError(
        "No bearer token returned from authentication endpoint",
      );
    }

    // Cache the token (Black Duck tokens typically expire after 2 hours)
    cachedBearerToken = bearerToken;
    tokenExpiry = Date.now() + 2 * 60 * 60 * 1000; // 2 hours

    return bearerToken;
  } catch (error: any) {
    // Clear cached token on auth failure
    cachedBearerToken = null;
    tokenExpiry = 0;

    if (error.response?.status === 401) {
      throw new ValidationError(
        "Invalid API token. Please check your BLACK_DUCK_API_TOKEN in .env file. " +
          "Generate a new token from: Black Duck > User Profile > My Access Tokens",
      );
    }

    throw error;
  }
}
