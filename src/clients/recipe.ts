// Recipe-related API client

import { BaseClient } from './base.js';
import { Recipe, PaginatedRecipeList, Keyword, Food, Unit } from '../types/index.js';

export class RecipeClient extends BaseClient {
  /**
   * List recipes with optional filtering and pagination
   */
  async listRecipes(params?: {
    page?: number;
    page_size?: number;
    query?: string;
    keywords?: number[];
    foods?: number[];
    books?: number[];
    rating_gte?: number;
    sort_order?: string;
  }): Promise<PaginatedRecipeList> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, v.toString()));
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = `/api/recipe/${queryString ? `?${queryString}` : ''}`;

    return this.request<PaginatedRecipeList>(endpoint);
  }

  /**
   * Get a single recipe by ID
   */
  async getRecipe(id: number): Promise<Recipe> {
    return this.request<Recipe>(`/api/recipe/${id}/`);
  }

  /**
   * Create a new recipe
   */
  async createRecipe(recipe: Recipe): Promise<Recipe> {
    return this.request<Recipe>('/api/recipe/', {
      method: 'POST',
      body: JSON.stringify(recipe),
    });
  }

  /**
   * Update an existing recipe (full update)
   */
  async updateRecipe(id: number, recipe: Recipe): Promise<Recipe> {
    return this.request<Recipe>(`/api/recipe/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(recipe),
    });
  }

  /**
   * Partially update an existing recipe
   */
  async patchRecipe(id: number, updates: Partial<Recipe>): Promise<Recipe> {
    return this.request<Recipe>(`/api/recipe/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Search for a keyword by name, or create it if it doesn't exist
   */
  async findOrCreateKeyword(name: string): Promise<{ id: number; name: string }> {
    // First, try to find the keyword
    const searchParams = new URLSearchParams({ query: name });
    const response = await this.request<{ 
      count: number; 
      results: { id: number; name: string; }[] 
    }>(`/api/keyword/?${searchParams.toString()}`);

    // Check for exact match
    const exactMatch = response.results.find(
      k => k.name.toLowerCase() === name.toLowerCase()
    );

    if (exactMatch) {
      return exactMatch;
    }

    // Create new keyword if not found
    return this.request<{ id: number; name: string }>('/api/keyword/', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  /**
   * Search for a food by name, or create it if it doesn't exist
   */
  async findOrCreateFood(name: string): Promise<{ id: number; name: string }> {
    // First, try to find the food
    const searchParams = new URLSearchParams({ query: name });
    const response = await this.request<{ 
      count: number; 
      results: { id: number; name: string; }[] 
    }>(`/api/food/?${searchParams.toString()}`);

    // Check for exact match
    const exactMatch = response.results.find(
      f => f.name.toLowerCase() === name.toLowerCase()
    );

    if (exactMatch) {
      return exactMatch;
    }

    // Create new food if not found
    return this.request<{ id: number; name: string }>('/api/food/', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  /**
   * Search for a unit by name
   */
  async findOrCreateUnit(name: string): Promise<{ id: number; name: string } | null> {
    if (!name) return null;

    // First, try to find the unit
    const searchParams = new URLSearchParams({ query: name });
    const response = await this.request<{ 
      count: number; 
      results: { id: number; name: string; }[] 
    }>(`/api/unit/?${searchParams.toString()}`);

    // Check for exact match
    const exactMatch = response.results.find(
      u => u.name.toLowerCase() === name.toLowerCase()
    );

    if (exactMatch) {
      return exactMatch;
    }

    // Create new unit if not found
    return this.request<{ id: number; name: string }>('/api/unit/', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }
}
