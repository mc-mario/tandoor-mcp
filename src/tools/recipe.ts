// Recipe tool definitions - optimized for minimal context

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const RECIPE_TOOLS: Tool[] = [
  {
    name: 'list_recipes',
    description: 'List recipes with optional filters: page, page_size, query, sort_order, rating_gte',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number' },
        page_size: { type: 'number' },
        query: { type: 'string' },
        sort_order: { type: 'string' },
        rating_gte: { type: 'number' },
      },
    },
  },
  {
    name: 'get_recipe',
    description: 'Get recipe details by ID',
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
    description: 'Create recipe. Required: name, steps[{instruction, ingredients[{food, amount, unit?}]}]. Optional: description, servings, working_time, waiting_time, keywords[]',
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
              instruction: { type: 'string' },
              time: { type: 'number' },
              ingredients: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    food: { type: 'string' },
                    amount: { type: 'number' },
                    unit: { type: 'string' },
                  },
                  required: ['food', 'amount'],
                },
              },
            },
            required: ['instruction', 'ingredients'],
          },
        },
        internal: { type: 'boolean' },
        show_ingredient_overview: { type: 'boolean' },
        private: { type: 'boolean' },
      },
      required: ['name', 'steps'],
    },
  },
  {
    name: 'update_recipe',
    description: 'Update recipe metadata and content. Only provide fields you want to update. All fields optional except id.',
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
        keywords: { type: 'array', items: { type: 'string' }, description: 'Tags/keywords for the recipe' },
        show_ingredient_overview: { type: 'boolean', description: 'Show ingredient overview' },
        steps: {
          type: 'array',
          description: 'Recipe steps (full replacement if provided)',
          items: {
            type: 'object',
            properties: {
              instruction: { type: 'string' },
              time: { type: 'number' },
              ingredients: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    food: { type: 'string' },
                    amount: { type: 'number' },
                    unit: { type: 'string' },
                    note: { type: 'string' },
                  },
                  required: ['food', 'amount'],
                },
              },
            },
            required: ['instruction', 'ingredients'],
          },
        },
      },
      required: ['id'],
    },
  },
];
