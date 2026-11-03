// Base HTTP client for making requests to Tandoor API

import { TandoorConfig } from '../types/index.js';

const MAX_PAGES = 20; // Safety cap for auto-pagination

export class BaseClient {
  protected baseUrl: string;
  protected token: string;

  constructor(config: TandoorConfig) {
    // Add https:// if no protocol specified
    let url = config.url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    this.baseUrl = url.replace(/\/$/, ''); // Remove trailing slash
    this.token = config.token;
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMessage = `Tandoor API error: ${response.status} ${response.statusText}`;

        // Read the body exactly once as text, then try to interpret it as JSON.
        // A response stream can only be consumed once — calling response.json()
        // and then response.text() in the catch throws "Body is unusable: Body
        // has already been read", which masked the real error whenever the
        // body wasn't valid JSON (e.g. Tandoor's HTML 500 page).
        let bodyText = '';
        try {
          bodyText = await response.text();
        } catch {
          // Body unreadable — leave empty
        }

        if (bodyText) {
          try {
            const errorData = JSON.parse(bodyText);
            // Try to extract meaningful error messages from the response
            if (errorData?.detail) {
              errorMessage += `\nDetail: ${errorData.detail}`;
            } else if (typeof errorData === 'object') {
              errorMessage += `\n${JSON.stringify(errorData, null, 2)}`;
            } else {
              errorMessage += `\n${bodyText}`;
            }
          } catch {
            // Not JSON (e.g. an HTML error page) — include the raw text, truncated
            const truncated = bodyText.length > 500 ? `${bodyText.slice(0, 500)}…` : bodyText;
            errorMessage += `\n${truncated}`;
          }
        }

        // Provide specific guidance for common errors
        if (response.status === 401) {
          errorMessage += '\n\nAuthentication failed. Please check your TANDOOR_TOKEN is valid.';
        } else if (response.status === 403) {
          errorMessage += '\n\nAccess forbidden. Your API token may not have the required permissions.';
        } else if (response.status === 404) {
          errorMessage += '\n\nResource not found. Please check the ID or URL is correct.';
        } else if (response.status === 500) {
          errorMessage += '\n\nServer error. Please check your Tandoor instance logs for details.';
        }

        throw new Error(errorMessage);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        // Re-throw our formatted errors
        if (error.message.includes('Tandoor API error')) {
          throw error;
        }
        // Network or other errors
        throw new Error(`Failed to connect to Tandoor: ${error.message}\nPlease check TANDOOR_URL is correct and the server is accessible.`);
      }
      throw error;
    }
  }

  /**
   * Fetch ALL pages of a paginated Tandoor endpoint.
   *
   * Tandoor's API defaults to 25 items per page with no warning — a naive
   * single-page fetch silently returns a partial list. This loops until the
   * server's `count` is reached (or `next` is null) so callers always see
   * the full dataset.
   */
  protected async listAll<T>(
    endpoint: string,
    pageSize = 100
  ): Promise<{ count: number; results: T[] }> {
    const results: T[] = [];
    let total = 0;

    for (let page = 1; page <= MAX_PAGES; page++) {
      const sep = endpoint.includes('?') ? '&' : '?';
      const data = await this.request<{
        count: number;
        next: string | null;
        results: T[];
      }>(`${endpoint}${sep}page=${page}&page_size=${pageSize}`);

      total = data.count ?? 0;
      results.push(...(data.results || []));

      if (data.next == null || results.length >= total) {
        break;
      }
    }

    return { count: total, results };
  }
}
