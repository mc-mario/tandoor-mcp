// Handlers for recipe tools

import { TandoorClient } from '../clients/index.js';
import { Recipe, Ingredient, Step, FoundRef } from '../types/index.js';

/** Render an ingredient as a compact human-readable line. */
function ingredientLine(ing: any): string {
  const foodName = ing?.food?.name ?? '';
  const unitName = ing?.unit?.name ?? '';
  const amount = ing?.amount ?? 0;
  let line = foodName;
  if (amount > 0) {
    line = `${amount} ${unitName} ${foodName}`.replace(/\s+/g, ' ').trim();
  }
  if (ing?.note) {
    line += ` (${ing.note})`;
  }
  return line;
}

/**
 * Compact recipe summary: everything a model needs for meal planning and
 * editing decisions without the full nested JSON (which can be 10-30 KB and
 * burns tokens on every call).
 */
function summarizeRecipe(recipe: any): any {
  return {
    id: recipe.id,
    name: recipe.name,
    servings: recipe.servings,
    servings_text: recipe.servings_text ?? null,
    internal: recipe.internal ?? false,
    rating: recipe.rating ?? null,
    last_cooked: recipe.last_cooked ?? null,
    keywords: (recipe.keywords || []).map((k: any) => k.name ?? k.label ?? k),
    working_time: recipe.working_time ?? 0,
    waiting_time: recipe.waiting_time ?? 0,
    source_url: recipe.source_url ?? null,
    steps: (recipe.steps || []).map((s: any) => ({
      name: s.name || '',
      instruction: s.instruction || '',
      ingredients: (s.ingredients || []).map(ingredientLine),
    })),
  };
}

// Helper function to process ingredients
async function processIngredients(
  client: TandoorClient,
  ingredients: any[]
): Promise<{ ingredients: Ingredient[]; createdFoods: FoundRef[]; createdUnits: FoundRef[] }> {
  const processedIngredients: Ingredient[] = [];
  const createdFoods: FoundRef[] = [];
  const createdUnits: FoundRef[] = [];

  for (let i = 0; i < ingredients.length; i++) {
    const ing = ingredients[i];

    // Find or create food
    const food = await client.recipes.findOrCreateFood(ing.food);
    if (food.created) createdFoods.push(food);

    // Find or create unit if provided
    const unit = ing.unit ? await client.recipes.findOrCreateUnit(ing.unit) : null;
    if (unit?.created) createdUnits.push(unit);

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

  return { ingredients: processedIngredients, createdFoods, createdUnits };
}

// Helper function to process steps
async function processSteps(
  client: TandoorClient,
  steps: any[]
): Promise<{ steps: Step[]; createdFoods: FoundRef[]; createdUnits: FoundRef[] }> {
  const processedSteps: Step[] = [];
  const createdFoods: FoundRef[] = [];
  const createdUnits: FoundRef[] = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    const result = await processIngredients(client, step.ingredients || []);
    createdFoods.push(...result.createdFoods);
    createdUnits.push(...result.createdUnits);

    processedSteps.push({
      name: step.name || '',
      instruction: step.instruction || '',
      ingredients: result.ingredients,
      time: step.time || 0,
      order: step.order !== undefined ? step.order : i,
      show_as_header: step.show_as_header || false,
    });
  }

  return { steps: processedSteps, createdFoods, createdUnits };
}

// Helper function to process keywords
async function processKeywords(
  client: TandoorClient,
  keywordNames: string[]
): Promise<{ keywords: any[]; createdKeywords: FoundRef[] }> {
  const keywords: any[] = [];
  const createdKeywords: FoundRef[] = [];

  for (const name of keywordNames) {
    const keyword = await client.recipes.findOrCreateKeyword(name);
    keywords.push(keyword as any);
    if (keyword.created) createdKeywords.push(keyword);
  }

  return { keywords, createdKeywords };
}

export async function handleListRecipes(
  client: TandoorClient,
  args: any
): Promise<string> {
  // Auto-paginates: Tandoor defaults to 25 items/page, so a single page
  // silently truncates larger collections.
  const result = await client.recipes.listAllRecipes(args);

  const compact = {
    count: result.count,
    fetched: result.results.length,
    results: result.results.map((r: any) => ({
      id: r.id,
      name: r.name,
      keywords: (r.keywords || []).map((k: any) => k.label ?? k.name),
      servings: r.servings,
      internal: r.internal ?? false,
    })),
  };

  return JSON.stringify(compact, null, 2);
}

export async function handleGetRecipe(
  client: TandoorClient,
  args: { id: number }
): Promise<string> {
  const recipe = await client.recipes.getRecipe(args.id);
  return JSON.stringify(summarizeRecipe(recipe), null, 2);
}

export async function handleCreateRecipe(
  client: TandoorClient,
  args: any
): Promise<string> {
  // Process steps with ingredients
  const stepsResult = await processSteps(client, args.steps || []);

  // Process keywords
  const keywordsResult = args.keywords
    ? await processKeywords(client, args.keywords)
    : { keywords: [], createdKeywords: [] };

  const recipe: Recipe = {
    name: args.name,
    description: args.description,
    servings: args.servings,
    servings_text: args.servings_text,
    working_time: args.working_time || 0,
    waiting_time: args.waiting_time || 0,
    source_url: args.source_url,
    keywords: keywordsResult.keywords,
    steps: stepsResult.steps,
    // Recipes must be visible in the UI: `internal: true` hides them from
    // the default recipe list. Default to false.
    internal: args.internal === true,
    show_ingredient_overview: args.show_ingredient_overview !== false,
    private: args.private || false,
  };

  const created = await client.recipes.createRecipe(recipe);

  const response: any = {
    message: 'Recipe created successfully!',
    recipe: summarizeRecipe(created),
  };
  const createdRefs: string[] = [];
  for (const f of stepsResult.createdFoods) createdRefs.push(`food "${f.name}"`);
  for (const u of stepsResult.createdUnits) createdRefs.push(`unit "${u.name}"`);
  for (const k of keywordsResult.createdKeywords) createdRefs.push(`keyword "${k.name}"`);
  if (createdRefs.length > 0) {
    response.created_new = createdRefs;
    response.warning = 'New records were created in Tandoor. If any of these names look like duplicates of existing entries, reuse the existing one instead.';
  }

  return JSON.stringify(response, null, 2);
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
  if (updateData.internal !== undefined) updates.internal = !!updateData.internal;
  if (updateData.show_ingredient_overview !== undefined) {
    updates.show_ingredient_overview = updateData.show_ingredient_overview;
  }
  if (updateData.private !== undefined) updates.private = updateData.private;

  let createdFoods: FoundRef[] = [];
  let createdUnits: FoundRef[] = [];
  let createdKeywords: FoundRef[] = [];

  // Process steps if provided (PATCH replaces the whole steps array)
  if (updateData.steps) {
    const stepsResult = await processSteps(client, updateData.steps);
    updates.steps = stepsResult.steps;
    createdFoods = stepsResult.createdFoods;
    createdUnits = stepsResult.createdUnits;
  }

  // Process keywords if provided
  if (updateData.keywords) {
    const keywordsResult = await processKeywords(client, updateData.keywords);
    updates.keywords = keywordsResult.keywords;
    createdKeywords = keywordsResult.createdKeywords;
  }

  const updated = await client.recipes.patchRecipe(id, updates);

  const response: any = {
    message: 'Recipe updated successfully!',
    recipe: summarizeRecipe(updated),
  };
  const createdRefs: string[] = [];
  for (const f of createdFoods) createdRefs.push(`food "${f.name}"`);
  for (const u of createdUnits) createdRefs.push(`unit "${u.name}"`);
  for (const k of createdKeywords) createdRefs.push(`keyword "${k.name}"`);
  if (createdRefs.length > 0) {
    response.created_new = createdRefs;
    response.warning = 'New records were created in Tandoor. If any of these names look like duplicates of existing entries, reuse the existing one instead.';
  }

  return JSON.stringify(response, null, 2);
}

export async function handleDeleteRecipe(
  client: TandoorClient,
  args: { id: number }
): Promise<string> {
  await client.recipes.deleteRecipe(args.id);
  return JSON.stringify({ message: `Recipe ${args.id} deleted successfully!`, deleted: true, id: args.id }, null, 2);
}

export async function handleListFoods(
  client: TandoorClient,
  args: { query?: string }
): Promise<string> {
  const result = await client.recipes.listFoods(args?.query);
  return JSON.stringify({
    count: result.count,
    results: result.results.map(f => ({ id: f.id, name: f.name, plural_name: f.plural_name ?? null })),
  }, null, 2);
}

export async function handleListUnits(
  client: TandoorClient,
  args: { query?: string }
): Promise<string> {
  const result = await client.recipes.listUnits(args?.query);
  return JSON.stringify({
    count: result.count,
    results: result.results.map(u => ({ id: u.id, name: u.name, plural_name: u.plural_name ?? null })),
  }, null, 2);
}

export async function handleListKeywords(
  client: TandoorClient,
  args: { query?: string }
): Promise<string> {
  const result = await client.recipes.listKeywords(args?.query);
  return JSON.stringify({
    count: result.count,
    results: result.results.map(k => ({ id: k.id, name: k.name })),
  }, null, 2);
}
