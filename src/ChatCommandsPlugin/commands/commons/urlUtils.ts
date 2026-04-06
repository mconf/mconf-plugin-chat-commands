/**
 * Utility functions for URL handling and validation
 */

/**
 * Checks if a string is a valid HTTP or HTTPS URL
 */
export function isValidHttpUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Extracts GraphQL WebSocket URL from a BigBlueButton join URL
 * Converts the HTTP(S) URL to WebSocket (ws) and appends the GraphQL path
 */
export function extractGraphQLWebSocketUrl(joinUrl: string): string | null {
  if (!isValidHttpUrl(joinUrl)) {
    return null;
  }

  try {
    const url = new URL(joinUrl);
    return `wss://${url.hostname}/graphql`;
  } catch {
    return null;
  }
}
