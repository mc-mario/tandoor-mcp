// Handlers for recipe tools

import { TandoorClient } from '../clients/index.js';
import { Recipe, Ingredient, Step, Keyword } from '../types/index.js';

// Helper function to process ingredients
async function processIngredients(
  client: TandoorClient,
  ingredients: any[]
): Promise<Ingredient[]> {
  const processedIngredients: Ingredient[] = [];

  for (let i = 0; i < ingredients.length; i++) {
    const ing = ingredients[i];
    
    // Find or create food
    const food = await client.recipes.findOrCreateFood(ing.food);
    
    // Find or create unit if provided
    const unit = ing.unit ? await client.recipes.findOrCreateUnit(ing.unit) : null;

    processedIngredients.push({
      food: food as any,
      unit: unit as any,
      amount: ing.amount,
      note: ing.note,
      order: ing.order !== undefined ? ing.order : i,
      is_header: ing.is_header || false,
      no_amount: ing.no_amount || false,
    });
  }

  return processedIngredients;
}

// Helper function to process steps
async function processSteps(
  client: TandoorClient,
  steps: any[]
): Promise<Step[]> {
  const processedSteps: Step[] = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    
    const ingredients = await processIngredients(client, step.ingredients || []);

    processedSteps.push({
      name: step.name || '',
      instruction: step.instruction,
      ingredients,
      time: step.time || 0,
      order: step.order !== undefined ? step.order : i,
      show_as_header: step.show_as_header || false,
    });
  }

  return processedSteps;
}

// Helper function to process keywords
async function processKeywords(
  client: TandoorClient,
  keywordNames: string[]
): Promise<Keyword[]> {
  const keywords: Keyword[] = [];

  for (const name of keywordNames) {
    const keyword = await client.recipes.findOrCreateKeyword(name);
    keywords.push(keyword as any);
  }

  return keywords;
}

export async function handleListRecipes(
  client: TandoorClient,
  args: any
): Promise<string> {
  const result = await client.recipes.listRecipes(args);
  return JSON.stringify(result, null, 2);
}

export async function handleGetRecipe(
  client: TandoorClient,
  args: { id: number }
): Promise<string> {
  const recipe = await client.recipes.getRecipe(args.id);
  return JSON.stringify(recipe, null, 2);
}

export async function handleCreateRecipe(
  client: TandoorClient,
  args: any
): Promise<string> {
  // Process steps with ingredients
  const steps = await processSteps(client, args.steps || []);
  
  // Process keywords
  const keywords = args.keywords 
    ? await processKeywords(client, args.keywords)
    : [];

  const recipe: Recipe = {
    name: args.name,
    description: args.description,
    servings: args.servings,
    servings_text: args.servings_text,
    working_time: args.working_time || 0,
    waiting_time: args.waiting_time || 0,
    source_url: args.source_url,
    keywords,
    steps,
    internal: args.internal !== false,
    show_ingredient_overview: args.show_ingredient_overview !== false,
    private: args.private || false,
  };

  const created = await client.recipes.createRecipe(recipe);
  return `Recipe created successfully!\n\n${JSON.stringify(created, null, 2)}`;
}

export async function handleUpdateRecipe(
  client: TandoorClient,
  args: any
): Promise<string> {
  const { id, ...updateData } = args;
  
  // Build update object
  const updates: Partial<Recipe> = {};
  
  if (updateData.name !== undefined) updates.name = updateData.name;
  if (updateData.description !== undefined) updates.description = updateData.description;
  if (updateData.servings !== undefined) updates.servings = updateData.servings;
  if (updateData.servings_text !== undefined) updates.servings_text = updateData.servings_text;
  if (updateData.working_time !== undefined) updates.working_time = updateData.working_time;
  if (updateData.waiting_time !== undefined) updates.waiting_time = updateData.waiting_time;
  if (updateData.source_url !== undefined) updates.source_url = updateData.source_url;
  if (updateData.internal !== undefined) updates.internal = updateData.internal;
  if (updateData.show_ingredient_overview !== undefined) {
    updates.show_ingredient_overview = updateData.show_ingredient_overview;
  }
  if (updateData.private !== undefined) updates.private = updateData.private;

  // Process steps if provided
  if (updateData.steps) {
    updates.steps = await processSteps(client, updateData.steps);
  }

  // Process keywords if provided
  if (updateData.keywords) {
    updates.keywords = await processKeywords(client, updateData.keywords);
  }

  const updated = await client.recipes.patchRecipe(id, updates);
  return `Recipe updated successfully!\n\n${JSON.stringify(updated, null, 2)}`;
}
