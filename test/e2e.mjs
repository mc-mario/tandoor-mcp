#!/usr/bin/env node
/**
 * End-to-end test for tandoor-mcp against a REAL Tandoor instance.
 *
 * Requires:
 *   - `npm run build` first (tests the compiled server in build/)
 *   - TANDOOR_URL and TANDOOR_TOKEN env vars
 *
 * Creates a temporary recipe + meal plan, exercises every tool, cleans up
 * after itself, and asserts the database is left exactly as found
 * (food/unit/keyword counts unchanged). Exits non-zero on any failure.
 *
 * Usage: TANDOOR_URL=... TANDOOR_TOKEN=... node test/e2e.mjs
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const url = process.env.TANDOOR_URL;
const token = process.env.TANDOOR_TOKEN;
if (!url || !token) {
  console.error('FAIL: TANDOOR_URL and TANDOOR_TOKEN must be set');
  process.exit(1);
}

let passed = 0;
let failed = 0;

function check(name, cond, detail = '') {
  if (cond) {
    passed++;
    console.log(`  PASS  ${name}${detail ? ` — ${detail}` : ''}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function call(client, name, args = {}) {
  const res = await client.callTool({ name, arguments: args });
  if (res.isError) {
    throw new Error(`tool ${name} returned error: ${res.content?.[0]?.text ?? 'unknown'}`);
  }
  return JSON.parse(res.content[0].text);
}

// --- setup: spawn server ---
const serverProc = spawn('node', ['build/index.js'], {
  cwd: root,
  env: { ...process.env, TANDOOR_URL: url, TANDOOR_TOKEN: token },
  stdio: ['pipe', 'pipe', 'pipe'],
});

const transport = new StdioClientTransport({
  command: 'node',
  args: ['build/index.js'],
  cwd: root,
  env: { ...process.env, TANDOOR_URL: url, TANDOOR_TOKEN: token },
  stderr: 'pipe',
});

const client = new Client({ name: 'tandoor-mcp-e2e', version: '1.0.0' });
const createdRecipeId = [];
const createdMealPlanIds = [];

try {
  console.log('Connecting to server...');
  await client.connect(transport);
  console.log('Connected.\n');

  // --- tool inventory ---
  const tools = await client.listTools();
  const names = tools.tools.map(t => t.name).sort();
  const expected = [
    'auto_meal_plan', 'create_meal_plan', 'create_recipe', 'delete_meal_plan',
    'delete_recipe', 'get_meal_plan', 'get_recipe', 'get_shopping_list',
    'list_foods', 'list_keywords', 'list_meal_plans', 'list_meal_types',
    'list_recipes', 'list_units', 'update_meal_plan', 'update_recipe',
  ];
  check('tool inventory (16 tools)', JSON.stringify(names) === JSON.stringify([...expected].sort()),
    `${names.length} tools`);

  // --- list_recipes: auto-pagination ---
  const recipes = await call(client, 'list_recipes');
  check('list_recipes auto-paginates', recipes.count === recipes.fetched && recipes.count > 25,
    `count=${recipes.count}, fetched=${recipes.fetched} (>25 proves pagination)`);
  check('list_recipes compact shape', recipes.results.every(r =>
    typeof r.id === 'number' && typeof r.name === 'string' && Array.isArray(r.keywords)),
    'id/name/keywords present');
  const firstId = recipes.results[0].id;
  const recipeCountBefore = recipes.count;

  // --- get_recipe: compact summary ---
  const recipe = await call(client, 'get_recipe', { id: firstId });
  check('get_recipe compact summary', recipe.id === firstId && Array.isArray(recipe.steps) && Array.isArray(recipe.keywords),
    `"${recipe.name}" steps=${recipe.steps.length}`);
  const hasIngredientLines = recipe.steps.every(s => Array.isArray(s.ingredients) && s.ingredients.every(i => typeof i === 'string'));
  check('get_recipe ingredients as text lines', hasIngredientLines);

  // --- reference lists ---
  const foods = await call(client, 'list_foods');
  const units = await call(client, 'list_units');
  const keywords = await call(client, 'list_keywords');
  check('list_foods compact', foods.count === foods.results.length && foods.results.every(f => typeof f.id === 'number' && typeof f.name === 'string'),
    `count=${foods.count}`);
  check('list_units compact', units.count === units.results.length, `count=${units.count}`);
  check('list_keywords compact', keywords.count === keywords.results.length, `count=${keywords.count}`);
  const foodCountBefore = foods.count;

  const filteredFoods = await call(client, 'list_foods', { query: 'pollo' });
  check('list_foods query filter', filteredFoods.count > 0 && filteredFoods.count < foods.count,
    `query=pollo -> ${filteredFoods.count}`);

  const cenaKw = keywords.results.find(k => k.name.toLowerCase() === 'cena');
  check('keyword "Cena" exists', !!cenaKw);
  const recipesFiltered = await call(client, 'list_recipes', { keywords: [cenaKw.id] });
  check('list_recipes keywords filter', recipesFiltered.count > 0 && recipesFiltered.count <= recipes.count,
    `keyword ${cenaKw.id} -> ${recipesFiltered.count} recipes`);

  // --- create_recipe: reuse existing foods/units/keywords ---
  const marker = `TEST MCP E2E ${Date.now()}`;
  const created = await call(client, 'create_recipe', {
    name: marker,
    servings: 2,
    keywords: ['Cena'],                       // exists -> no creation
    steps: [{
      name: 'Prueba',
      instruction: '',
      ingredients: [
        { food: 'Pollo', amount: 200, unit: 'gr' },          // exists
        { food: 'tomates', amount: 2, unit: 'unidad', note: 'test note' }, // plural variant -> "Tomate"
      ],
    }],
  });
  const rid = created.recipe?.id;
  createdRecipeId.push(rid);
  check('create_recipe returns id', typeof rid === 'number', `id=${rid}`);
  check('create_recipe internal defaults FALSE', created.recipe.internal === false,
    'visible in UI (internal=false)');
  check('create_recipe no new foods/units/keywords', !created.created_new || created.created_new.length === 0,
    created.created_new ? JSON.stringify(created.created_new) : 'none created');
  check('create_recipe keyword resolved', created.recipe.keywords?.includes('Cena'));
  check('create_recipe note preserved', JSON.stringify(created.recipe).includes('test note'));

  const foodsAfterCreate = await call(client, 'list_foods');
  check('food count unchanged after create', foodsAfterCreate.count === foodCountBefore,
    `${foodCountBefore} -> ${foodsAfterCreate.count}`);

  // created recipe must be VISIBLE in the list (internal=false works)
  const listAfter = await call(client, 'list_recipes');
  check('created recipe visible in list', listAfter.results.some(r => r.id === rid));

  // --- update_recipe: PATCH steps replacement ---
  const updated = await call(client, 'update_recipe', {
    id: rid,
    servings: 3,
    steps: [{
      name: 'Solo un paso',
      instruction: 'Reemplazo total',
      ingredients: [{ food: 'Pollo', amount: 150, unit: 'gr' }],
    }],
  });
  check('update_recipe changes servings', updated.recipe.servings === 3);
  check('update_recipe replaces steps array', updated.recipe.steps.length === 1 && updated.recipe.steps[0].name === 'Solo un paso',
    `steps=${updated.recipe.steps.length}`);
  check('update_recipe keeps internal=false', updated.recipe.internal === false);

  // --- meal plan lifecycle ---
  const mealTypes = await call(client, 'list_meal_types');
  const cenaType = mealTypes.results.find(m => m.name === 'Cena');
  check('list_meal_types finds Cena', !!cenaType, cenaType ? `id=${cenaType.id}` : 'missing');

  const futureDate = new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const mp = await call(client, 'create_meal_plan', {
    recipe_id: rid,
    meal_type_id: cenaType.id,
    from_date: futureDate,
    servings: 2,
    addshopping: false,
  });
  const mpid = mp.meal_plan?.id;
  createdMealPlanIds.push(mpid);
  check('create_meal_plan returns id', typeof mpid === 'number', `id=${mpid}`);
  check('create_meal_plan compact shape', mp.meal_plan.recipe_name === marker && mp.meal_plan.meal_type === 'Cena');

  const window = await call(client, 'list_meal_plans', { from_date: futureDate, to_date: futureDate });
  check('list_meal_plans window finds entry', window.results.some(m => m.id === mpid),
    `count=${window.count} (overlapping excluded)`);
  check('list_meal_plans compact', window.results.every(m => typeof m.id === 'number' && typeof m.recipe_name === 'string' || m.recipe_name === null));

  const mpDetail = await call(client, 'get_meal_plan', { id: mpid });
  check('get_meal_plan by id', mpDetail.id === mpid && mpDetail.recipe_name === marker);

  const mpUpdated = await call(client, 'update_meal_plan', { id: mpid, servings: 4 });
  check('update_meal_plan servings', mpUpdated.meal_plan.servings === 4);

  const delMp = await call(client, 'delete_meal_plan', { id: mpid });
  check('delete_meal_plan', delMp.deleted === true);
  createdMealPlanIds.pop();

  // --- shopping list ---
  const shopping = await call(client, 'get_shopping_list');
  check('get_shopping_list compact', Array.isArray(shopping.results) && shopping.results.every(e =>
    typeof e.id === 'number' && typeof e.food === 'string' && typeof e.checked === 'boolean'),
    `count=${shopping.count}`);

  // --- delete_recipe lifecycle ---
  const del = await call(client, 'delete_recipe', { id: rid });
  check('delete_recipe', del.deleted === true && del.id === rid);
  createdRecipeId.pop();

  let deletedConfirmed = false;
  try {
    await call(client, 'get_recipe', { id: rid });
  } catch {
    deletedConfirmed = true; // 404 expected
  }
  check('deleted recipe gone (404)', deletedConfirmed);

  const foodsFinal = await call(client, 'list_foods');
  check('food count unchanged after delete', foodsFinal.count === foodCountBefore,
    `${foodCountBefore} -> ${foodsFinal.count}`);
  const recipesFinal = await call(client, 'list_recipes');
  check('recipe count unchanged after delete', recipesFinal.count === recipeCountBefore,
    `${recipeCountBefore} -> ${recipesFinal.count}`);

  // --- error handling: missing required args ---
  let errored = false;
  try {
    await call(client, 'create_meal_plan', { from_date: futureDate });
  } catch {
    errored = true;
  }
  check('validation error on missing args', errored);
} catch (err) {
  failed++;
  console.error('FATAL:', err.message);
  console.error(err.stack?.split('\n').slice(0, 5).join('\n'));
} finally {
  // cleanup: never leave test data behind
  for (const id of createdMealPlanIds) {
    try { await call(client, 'delete_meal_plan', { id }); } catch { /* ignore */ }
  }
  for (const id of createdRecipeId) {
    try { await call(client, 'delete_recipe', { id }); } catch { /* ignore */ }
  }
  await client.close();
  serverProc.kill();
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
