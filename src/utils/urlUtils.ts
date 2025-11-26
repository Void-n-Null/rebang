import queryString from "query-string";

  /**
   * Validate that a URL is safe to redirect to
   * This provides basic security to prevent open redirect vulnerabilities
   */
export function validateRedirectUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (error) {
      console.error("Invalid redirect URL:", url, error);
      return false;
    }
  }

export function getBaseDomain(urlPattern: string): string {
  try {
    const url = new URL(urlPattern);
    // Include port if present (important for localhost:5173, etc.)
    return url.origin;
  } catch (error) {
    console.error("Failed to parse URL:", urlPattern);
    return urlPattern;
  }
}

export function getParametersFromUrl(url: string): URLSearchParams {
        try {
          // Parse URL with query-string
          const parsed = queryString.parseUrl(url, { parseFragmentIdentifier: true });
          const params = new URLSearchParams();
          
          // Add all parameters from the query section
          Object.entries(parsed.query).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              // Handle array values
              value.forEach(val => val !== null && params.append(key, val));
            } else if (value !== null) {
              // Handle string values
              params.append(key, value);
            }
          });
          
          // If there's a fragment with query params, add those too
          if (parsed.fragmentIdentifier && parsed.fragmentIdentifier.includes('=')) {
            const fragmentParams = queryString.parse(parsed.fragmentIdentifier);
            Object.entries(fragmentParams).forEach(([key, value]) => {
              if (Array.isArray(value)) {
                value.forEach(val => val !== null && params.append(key, val));
              } else if (value !== null) {
                params.append(key, value);
              }
            });
          }
          
          return params;
        } catch (error) {
          console.error("Error parsing URL parameters:", error);
          return new URLSearchParams();
        }
      }