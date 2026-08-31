// Handlers for meal plan tools

import { TandoorClient } from '../clients/index.js';
import { MealPlan, MealType } from '../types/index.js';

function compactMealPlan(m: any): any {
  return {
    id: m.id,
    from_date: m.from_date?.slice(0, 10) ?? null,
    to_date: m.to_date?.slice(0, 10) ?? null,
    meal_type: m.meal_type?.name ?? null,
    recipe_name: m.recipe?.name ?? m.recipe_name ?? null,
    title: m.title ?? null,
    servings: m.servings,
    note: m.note ?? null,
  };
}

export async function handleListMealPlans(
  client: TandoorClient,
  args: any
): Promise<string> {
  const { from_date, to_date, meal_type, ...rest } = args || {};

  // Auto-paginates; Tandoor defaults to 25 items/page.
  const result = await client.mealPlans.listAllMealPlans({
    from_date,
    to_date,
    meal_type,
  });

  // The Tandoor API returns entries that OVERLAP the window, not only the
  // ones that start inside it. When a window is requested, keep only entries
  // whose from_date falls within [from_date, to_date] — that's what callers
  // actually mean by "the plan for this week".
  let entries = result.results;
  if (from_date || to_date) {
    const start = from_date ? from_date.slice(0, 10) : null;
    const end = to_date ? to_date.slice(0, 10) : null;
    entries = entries.filter((m: any) => {
      const fd = m.from_date?.slice(0, 10) ?? null;
      if (!fd) return false;
      if (start && fd < start) return false;
      if (end && fd > end) return false;
      return true;
    });
  }

  const compact = {
    count: entries.length,
    total_overlapping: result.count,
    results: entries.map(compactMealPlan),
  };

  return JSON.stringify(compact, null, 2);
}

export async function handleGetMealPlan(
  client: TandoorClient,
  args: { id: number }
): Promise<string> {
  const mealPlan = await client.mealPlans.getMealPlan(args.id);
  return JSON.stringify(compactMealPlan(mealPlan), null, 2);
}

export async function handleCreateMealPlan(
  client: TandoorClient,
  args: any
): Promise<string> {
  // Validate required parameters
  if (!args.servings || typeof args.servings !== 'number' || args.servings <= 0) {
    throw new Error('servings must be a positive number');
  }

  if (!args.from_date || typeof args.from_date !== 'string') {
    throw new Error('from_date is required and must be a date string (ISO 8601 format)');
  }

  if (!args.meal_type_id || typeof args.meal_type_id !== 'number') {
    throw new Error('meal_type_id is required and must be a number (use list_meal_types to get available IDs)');
  }

  // Must have either recipe_id or title
  if (!args.recipe_id && !args.title) {
    throw new Error('Either recipe_id or title must be provided');
  }

  // Build meal plan object - API expects IDs, not nested objects
  const mealPlan: any = {
    servings: args.servings,
    from_date: args.from_date,
    meal_type: args.meal_type_id,  // Just the ID
  };

  if (args.recipe_id) {
    mealPlan.recipe = args.recipe_id;  // Just the ID
  }

  if (args.title) {
    mealPlan.title = args.title;
  }

  if (args.to_date) {
    mealPlan.to_date = args.to_date;
  }

  if (args.note) {
    mealPlan.note = args.note;
  }

  if (args.addshopping !== undefined) {
    mealPlan.addshopping = args.addshopping;
  }

  const created = await client.mealPlans.createMealPlan(mealPlan);
  return JSON.stringify({
    message: 'Meal plan created successfully!',
    meal_plan: compactMealPlan(created),
  }, null, 2);
}

export async function handleUpdateMealPlan(
  client: TandoorClient,
  args: any
): Promise<string> {
  const { id, ...updateData } = args;

  // Validate required parameters
  if (!id || typeof id !== 'number') {
    throw new Error('id is required and must be a number');
  }

  // Validate servings if provided
  if (updateData.servings !== undefined && (typeof updateData.servings !== 'number' || updateData.servings <= 0)) {
    throw new Error('servings must be a positive number');
  }

  // Build update object - API expects IDs, not nested objects
  const updates: any = {};

  if (updateData.recipe_id !== undefined) {
    updates.recipe = updateData.recipe_id;  // Just the ID
  }

  if (updateData.title !== undefined) {
    updates.title = updateData.title;
  }

  if (updateData.servings !== undefined) {
    updates.servings = updateData.servings;
  }

  if (updateData.from_date !== undefined) {
    updates.from_date = updateData.from_date;
  }

  if (updateData.to_date !== undefined) {
    updates.to_date = updateData.to_date;
  }

  if (updateData.meal_type_id !== undefined) {
    updates.meal_type = updateData.meal_type_id;  // Just the ID
  }

  if (updateData.note !== undefined) {
    updates.note = updateData.note;
  }

  if (Object.keys(updates).length === 0) {
    throw new Error('At least one field must be provided to update');
  }

  const updated = await client.mealPlans.patchMealPlan(id, updates);
  return JSON.stringify({
    message: 'Meal plan updated successfully!',
    meal_plan: compactMealPlan(updated),
  }, null, 2);
}

export async function handleDeleteMealPlan(
  client: TandoorClient,
  args: { id: number }
): Promise<string> {
  await client.mealPlans.deleteMealPlan(args.id);
  return JSON.stringify({ message: `Meal plan ${args.id} deleted successfully!`, deleted: true, id: args.id }, null, 2);
}

export async function handleAutoMealPlan(
  client: TandoorClient,
  args: any
): Promise<string> {
  // Validate required parameters
  if (!args.start_date || typeof args.start_date !== 'string') {
    throw new Error('start_date is required and must be a date string (YYYY-MM-DD)');
  }

  if (!args.end_date || typeof args.end_date !== 'string') {
    throw new Error('end_date is required and must be a date string (YYYY-MM-DD)');
  }

  if (!args.meal_type_id || typeof args.meal_type_id !== 'number') {
    throw new Error('meal_type_id is required and must be a number (use list_meal_types to get available IDs)');
  }

  if (!args.keyword_ids || !Array.isArray(args.keyword_ids) || args.keyword_ids.length === 0) {
    throw new Error('keyword_ids is required and must be a non-empty array of keyword IDs');
  }

  if (!args.servings || typeof args.servings !== 'number' || args.servings <= 0) {
    throw new Error('servings must be a positive number');
  }

  // Validate date order
  const startDate = new Date(args.start_date);
  const endDate = new Date(args.end_date);
  if (startDate > endDate) {
    throw new Error('start_date must be before or equal to end_date');
  }

  const result = await client.mealPlans.autoCreateMealPlans({
    start_date: args.start_date,
    end_date: args.end_date,
    meal_type_id: args.meal_type_id,
    keyword_ids: args.keyword_ids,
    servings: args.servings,
    addshopping: args.addshopping || false,
  });

  return `Auto meal plan created successfully!\n\n${JSON.stringify(result, null, 2)}`;
}

export async function handleListMealTypes(
  client: TandoorClient,
  args: any
): Promise<string> {
  const mealTypes = await client.mealPlans.listMealTypes();
  return JSON.stringify({
    count: mealTypes.length,
    results: mealTypes.map((m: MealType) => ({ id: m.id, name: m.name, order: m.order })),
  }, null, 2);
}

export async function handleGetShoppingList(
  client: TandoorClient,
  args: any
): Promise<string> {
  const result = await client.mealPlans.listShoppingList();
  return JSON.stringify({
    count: result.count,
    results: result.results.map((e: any) => ({
      id: e.id,
      food: e.food?.name ?? null,
      amount: e.amount ?? 0,
      unit: e.unit?.name ?? null,
      checked: e.checked ?? false,
    })),
  }, null, 2);
}
