// Recipe-related API client

import { BaseClient } from './base.js';
import {
  Recipe,
  PaginatedRecipeList,
  KeywordOverview,
  FoodOverview,
  UnitOverview,
  FoundRef,
} from '../types/index.js';

/** Normalize a free-text name for matching: trim, lowercase, collapse spaces. */
function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

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
   * List ALL recipes across pages (Tandoor defaults to 25/page).
   * Optional server-side filters are forwarded.
   */
  async listAllRecipes(params?: {
    query?: string;
    keywords?: number[];
    rating_gte?: number;
    sort_order?: string;
  }): Promise<{ count: number; results: PaginatedRecipeList['results'] }> {
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

    return this.listAll<PaginatedRecipeList['results'][number]>(endpoint);
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
   * Delete a recipe by ID (permanent)
   */
  async deleteRecipe(id: number): Promise<void> {
    return this.request<void>(`/api/recipe/${id}/`, {
      method: 'DELETE',
    });
  }

  /**
   * List all foods (optionally filtered by query)
   */
  async listFoods(query?: string): Promise<{
    count: number;
    results: FoodOverview[];
  }> {
    const endpoint = query
      ? `/api/food/?query=${encodeURIComponent(query)}`
      : '/api/food/';
    return this.listAll<FoodOverview>(endpoint);
  }

  /**
   * List all units (optionally filtered by query)
   */
  async listUnits(query?: string): Promise<{
    count: number;
    results: UnitOverview[];
  }> {
    const endpoint = query
      ? `/api/unit/?query=${encodeURIComponent(query)}`
      : '/api/unit/';
    return this.listAll<UnitOverview>(endpoint);
  }

  /**
   * List all keywords (optionally filtered by query)
   */
  async listKeywords(query?: string): Promise<{
    count: number;
    results: KeywordOverview[];
  }> {
    const endpoint = query
      ? `/api/keyword/?query=${encodeURIComponent(query)}`
      : '/api/keyword/';
    return this.listAll<KeywordOverview>(endpoint);
  }

  /**
   * Search for a keyword by name, or create it if it doesn't exist.
   * Matching is normalized (trim + lowercase). The `created` flag tells the
   * caller whether a NEW record was written to the database.
   */
  async findOrCreateKeyword(name: string): Promise<FoundRef> {
    const normalized = normalizeName(name);
    const response = await this.request<{
      count: number;
      results: KeywordOverview[];
    }>(`/api/keyword/?query=${encodeURIComponent(normalized)}&page_size=100`);

    const exactMatch = response.results.find(
      k => normalizeName(k.name) === normalized
    );

    if (exactMatch) {
      return { id: exactMatch.id, name: exactMatch.name, created: false };
    }

    const created = await this.request<KeywordOverview>('/api/keyword/', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim() }),
    });
    return { id: created.id, name: created.name, created: true };
  }

  /**
   * Search for a food by name, or create it if it doesn't exist.
   *
   * Matching is normalized (trim + lowercase) and also checks `plural_name`
   * plus a Spanish singular/plural heuristic ("tomates" → "tomate") so
   * variant spellings reuse existing foods instead of creating duplicates.
   * The `created` flag tells the caller whether a NEW food was written.
   */
  async findOrCreateFood(name: string): Promise<FoundRef> {
    const normalized = normalizeName(name);
    const response = await this.request<{
      count: number;
      results: FoodOverview[];
    }>(`/api/food/?query=${encodeURIComponent(normalized)}&page_size=100`);

    // Exact normalized match on name or plural_name
    const exactMatch = response.results.find(
      f =>
        normalizeName(f.name) === normalized ||
        (f.plural_name != null && normalizeName(f.plural_name) === normalized)
    );

    if (exactMatch) {
      return { id: exactMatch.id, name: exactMatch.name, created: false };
    }

    // Spanish singular/plural heuristic: only ever matches EXISTING foods,
    // so it can reduce duplicates but never invents a wrong match.
    // Each variant gets its OWN query — the original query may not match
    // the variant (substring search: "tomates" won't match "Tomate").
    const variants: string[] = [];
    if (normalized.endsWith('s') && !normalized.endsWith('ss')) {
      variants.push(normalized.slice(0, -1));
    } else if (!normalized.endsWith('s')) {
      variants.push(`${normalized}s`);
    }

    for (const variant of variants) {
      const variantResponse = await this.request<{
        count: number;
        results: FoodOverview[];
      }>(`/api/food/?query=${encodeURIComponent(variant)}&page_size=100`);
      const variantMatch = variantResponse.results.find(
        f =>
          normalizeName(f.name) === variant ||
          (f.plural_name != null && normalizeName(f.plural_name) === variant)
      );
      if (variantMatch) {
        return { id: variantMatch.id, name: variantMatch.name, created: false };
      }
    }

    const created = await this.request<FoodOverview>('/api/food/', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim() }),
    });
    return { id: created.id, name: created.name, created: true };
  }

  /**
   * Search for a unit by name, or create it if it doesn't exist.
   * Matching is normalized (trim + lowercase) and also checks `plural_name`.
   * No singular/plural heuristic here — units are short codes ("gr", "g")
   * where guessing is more likely to create noise than to help.
   */
  async findOrCreateUnit(name: string): Promise<FoundRef | null> {
    if (!name) return null;

    const normalized = normalizeName(name);
    const response = await this.request<{
      count: number;
      results: UnitOverview[];
    }>(`/api/unit/?query=${encodeURIComponent(normalized)}&page_size=100`);

    const exactMatch = response.results.find(
      u =>
        normalizeName(u.name) === normalized ||
        (u.plural_name != null && normalizeName(u.plural_name) === normalized)
    );

    if (exactMatch) {
      return { id: exactMatch.id, name: exactMatch.name, created: false };
    }

    const created = await this.request<UnitOverview>('/api/unit/', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim() }),
    });
    return { id: created.id, name: created.name, created: true };
  }
}
