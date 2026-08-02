import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const MEAL_PLAN_TOOLS: Tool[] = [
  {
    name: 'list_meal_plans',
    description: 'List meal plans (auto-paginates). Optional: from_date, to_date (YYYY-MM-DD). When a date window is given, only entries STARTING inside the window are returned (overlapping entries from other weeks are filtered out).',
    inputSchema: {
      type: 'object',
      properties: {
        from_date: { type: 'string', description: 'YYYY-MM-DD' },
        to_date: { type: 'string', description: 'YYYY-MM-DD' },
      },
    },
  },
  {
    name: 'get_meal_plan',
    description: 'Get meal plan by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_meal_plan',
    description: 'Create meal plan. Required: from_date (YYYY-MM-DD), meal_type_id, servings. Optional: recipe_id, title, note, addshopping (add ingredients to shopping list). Either recipe_id or title must be provided.',
    inputSchema: {
      type: 'object',
      properties: {
        recipe_id: { type: 'number' },
        title: { type: 'string', description: 'Free-text meal (when no recipe_id)' },
        servings: { type: 'number' },
        from_date: { type: 'string', description: 'YYYY-MM-DD' },
        to_date: { type: 'string', description: 'YYYY-MM-DD (same as from_date for single-day entries)' },
        meal_type_id: { type: 'number', description: 'Use list_meal_types to find IDs' },
        note: { type: 'string' },
        addshopping: { type: 'boolean', description: 'Add recipe ingredients to the shopping list' },
      },
      required: ['from_date', 'meal_type_id', 'servings'],
    },
  },
  {
    name: 'update_meal_plan',
    description: 'Update meal plan. Required: id. All other fields optional',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        recipe_id: { type: 'number' },
        title: { type: 'string' },
        servings: { type: 'number' },
        from_date: { type: 'string' },
        meal_type_id: { type: 'number' },
        note: { type: 'string' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_meal_plan',
    description: 'Delete meal plan by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
      },
      required: ['id'],
    },
  },
  {
    name: 'auto_meal_plan',
    description: 'Auto-generate meal plans. Required: start_date, end_date (YYYY-MM-DD), meal_type_id, keyword_ids[], servings, addshopping',
    inputSchema: {
      type: 'object',
      properties: {
        start_date: { type: 'string' },
        end_date: { type: 'string' },
        meal_type_id: { type: 'number' },
        keyword_ids: { type: 'array', items: { type: 'number' } },
        servings: { type: 'number' },
        addshopping: { type: 'boolean' },
      },
      required: ['start_date', 'end_date', 'meal_type_id', 'keyword_ids', 'servings', 'addshopping'],
    },
  },
  {
    name: 'list_meal_types',
    description: 'List available meal types (breakfast, lunch, dinner, etc.)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_shopping_list',
    description: 'Get the current shopping list: id, food, amount, unit, checked.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];
