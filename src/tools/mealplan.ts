import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const MEAL_PLAN_TOOLS: Tool[] = [
  {
    name: 'list_meal_plans',
    description: 'List meal plans. Optional: from_date, to_date (YYYY-MM-DD), page, page_size',
    inputSchema: {
      type: 'object',
      properties: {
        from_date: { type: 'string' },
        to_date: { type: 'string' },
        page: { type: 'number' },
        page_size: { type: 'number' },
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
    description: 'Create meal plan. Required: from_date (ISO), meal_type_id, servings. Optional: recipe_id, title, note, addshopping',
    inputSchema: {
      type: 'object',
      properties: {
        recipe_id: { type: 'number' },
        title: { type: 'string' },
        servings: { type: 'number' },
        from_date: { type: 'string' },
        to_date: { type: 'string' },
        meal_type_id: { type: 'number' },
        note: { type: 'string' },
        addshopping: { type: 'boolean' },
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
];
