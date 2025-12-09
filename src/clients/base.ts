// Base HTTP client for making requests to Tandoor API

import { TandoorConfig } from '../types/index.js';

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
        
        try {
          const errorData = await response.json();
          // Try to extract meaningful error messages from the response
          if (errorData.detail) {
            errorMessage += `\nDetail: ${errorData.detail}`;
          } else if (typeof errorData === 'object') {
            errorMessage += `\n${JSON.stringify(errorData, null, 2)}`;
          }
        } catch {
          // If JSON parsing fails, try to get text
          const errorText = await response.text();
          if (errorText) {
            errorMessage += `\n${errorText}`;
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
}
