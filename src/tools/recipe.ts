// Recipe tool definitions - optimized for minimal context

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const RECIPE_TOOLS: Tool[] = [
  {
    name: 'list_recipes',
    description: 'List ALL recipes (auto-paginates past the 25/page default). Optional filters: query, keywords (keyword IDs), rating_gte, sort_order. Returns compact rows: id, name, keywords, servings.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Text search' },
        keywords: { type: 'array', items: { type: 'number' }, description: 'Filter by keyword IDs (see list_keywords)' },
        rating_gte: { type: 'number', description: 'Only recipes rated >= this value' },
        sort_order: { type: 'string', description: 'Sort order' },
      },
    },
  },
  {
    name: 'get_recipe',
    description: 'Get recipe details by ID. Returns a compact summary (name, servings, keywords, steps with ingredients as text lines) — not the full raw JSON.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Recipe ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_recipe',
    description: 'Create recipe. Required: name, steps[{instruction?, ingredients?}]. Ingredients: food (name, auto-resolved to existing food if possible), amount, unit?, note?. Optional: description, servings, working_time, waiting_time, keywords[] (names, auto-resolved). Recipes are created visible in the UI (internal=false). Response reports any new foods/units/keywords created.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        servings: { type: 'number' },
        servings_text: { type: 'string' },
        working_time: { type: 'number' },
        waiting_time: { type: 'number' },
        source_url: { type: 'string' },
        keywords: { type: 'array', items: { type: 'string' } },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Step name (optional)' },
              instruction: { type: 'string', description: 'Step instructions (optional for ingredient-only recipes)' },
              time: { type: 'number' },
              ingredients: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    food: { type: 'string', description: 'Food name — matched to an existing food when possible' },
                    amount: { type: 'number' },
                    unit: { type: 'string', description: 'Unit name — matched to an existing unit when possible' },
                    note: { type: 'string', description: 'e.g. "o mixta cerdo+vacuno 48/32"' },
                  },
                  required: ['food', 'amount'],
                },
              },
            },
          },
        },
        internal: { type: 'boolean', description: 'Hide from the default UI recipe list (default false — leave false unless you mean it)' },
        show_ingredient_overview: { type: 'boolean' },
        private: { type: 'boolean' },
      },
      required: ['name', 'steps'],
    },
  },
  {
    name: 'update_recipe',
    description: 'Update recipe metadata and content. Only provide fields you want to update. All fields optional except id. NOTE: if steps is provided, it REPLACES the entire steps array — include every step. Response includes the compact updated recipe.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Recipe ID' },
        name: { type: 'string', description: 'Recipe name' },
        description: { type: 'string', description: 'Recipe description' },
        servings: { type: 'number', description: 'Number of servings' },
        servings_text: { type: 'string', description: 'Text description of servings' },
        working_time: { type: 'number', description: 'Active working time in minutes' },
        waiting_time: { type: 'number', description: 'Passive waiting time in minutes' },
        keywords: { type: 'array', items: { type: 'string' }, description: 'Tags/keywords for the recipe (names, auto-resolved)' },
        internal: { type: 'boolean', description: 'Hide from the default UI recipe list (default false)' },
        show_ingredient_overview: { type: 'boolean', description: 'Show ingredient overview' },
        steps: {
          type: 'array',
          description: 'Recipe steps (FULL replacement if provided)',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Step name (optional)' },
              instruction: { type: 'string' },
              time: { type: 'number' },
              ingredients: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    food: { type: 'string', description: 'Food name — matched to an existing food when possible' },
                    amount: { type: 'number' },
                    unit: { type: 'string', description: 'Unit name — matched to an existing unit when possible' },
                    note: { type: 'string' },
                  },
                  required: ['food', 'amount'],
                },
              },
            },
          },
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_recipe',
    description: 'Permanently delete a recipe by ID. Irreversible.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Recipe ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_foods',
    description: 'List foods (optionally filtered by name query). Use before creating recipes to pick existing food names/IDs and avoid duplicates.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Optional name filter' },
      },
    },
  },
  {
    name: 'list_units',
    description: 'List units (optionally filtered by name query).',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Optional name filter' },
      },
    },
  },
  {
    name: 'list_keywords',
    description: 'List keywords (optionally filtered by name query). Use to find keyword IDs for filtering recipes.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Optional name filter' },
      },
    },
  },
];
