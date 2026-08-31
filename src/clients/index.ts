// Main Tandoor client that combines all sub-clients

import { TandoorConfig } from '../types/index.js';
import { RecipeClient } from './recipe.js';
import { MealPlanClient } from './mealplan.js';

export class TandoorClient {
  public recipes: RecipeClient;
  public mealPlans: MealPlanClient;

  constructor(config: TandoorConfig) {
    this.recipes = new RecipeClient(config);
    this.mealPlans = new MealPlanClient(config);
  }

  // Legacy methods for backward compatibility
  async listRecipes(...args: Parameters<RecipeClient['listRecipes']>) {
    return this.recipes.listRecipes(...args);
  }

  async getRecipe(...args: Parameters<RecipeClient['getRecipe']>) {
    return this.recipes.getRecipe(...args);
  }

  async createRecipe(...args: Parameters<RecipeClient['createRecipe']>) {
    return this.recipes.createRecipe(...args);
  }

  async updateRecipe(...args: Parameters<RecipeClient['updateRecipe']>) {
    return this.recipes.updateRecipe(...args);
  }

  async patchRecipe(...args: Parameters<RecipeClient['patchRecipe']>) {
    return this.recipes.patchRecipe(...args);
  }

  async findOrCreateKeyword(...args: Parameters<RecipeClient['findOrCreateKeyword']>) {
    return this.recipes.findOrCreateKeyword(...args);
  }

  async findOrCreateFood(...args: Parameters<RecipeClient['findOrCreateFood']>) {
    return this.recipes.findOrCreateFood(...args);
  }

  async findOrCreateUnit(...args: Parameters<RecipeClient['findOrCreateUnit']>) {
    return this.recipes.findOrCreateUnit(...args);
  }

  async deleteRecipe(...args: Parameters<RecipeClient['deleteRecipe']>) {
    return this.recipes.deleteRecipe(...args);
  }

  async listFoods(...args: Parameters<RecipeClient['listFoods']>) {
    return this.recipes.listFoods(...args);
  }

  async listUnits(...args: Parameters<RecipeClient['listUnits']>) {
    return this.recipes.listUnits(...args);
  }

  async listKeywords(...args: Parameters<RecipeClient['listKeywords']>) {
    return this.recipes.listKeywords(...args);
  }
}

// Re-export for convenience
export * from './base.js';
export * from './recipe.js';
export * from './mealplan.js';
