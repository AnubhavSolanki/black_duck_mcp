import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

export interface BlackDuckConfig {
  url: string;
  apiToken: string;
  timeout: number;
  debug: boolean;
}

/**
 * Load and validate Black Duck configuration from environment variables
 */
function loadConfig(): BlackDuckConfig {
  const url = process.env.BLACK_DUCK_URL;
  const apiToken = process.env.BLACK_DUCK_API_TOKEN;
  const timeout = parseInt(process.env.BLACK_DUCK_TIMEOUT || '30000', 10);
  const debug = process.env.DEBUG === 'true';

  // Validate required configuration
  if (!url) {
    throw new Error(
      'BLACK_DUCK_URL is required. Please set it in your .env file or environment variables.'
    );
  }

  if (!apiToken) {
    throw new Error(
      'BLACK_DUCK_API_TOKEN is required. Please set it in your .env file or environment variables.'
    );
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (error) {
    throw new Error(
      `BLACK_DUCK_URL is not a valid URL: ${url}`
    );
  }

  // Remove trailing slash from URL
  const normalizedUrl = url.replace(/\/$/, '');

  return {
    url: normalizedUrl,
    apiToken,
    timeout,
    debug,
  };
}

// Export singleton config instance
export const config = loadConfig();
