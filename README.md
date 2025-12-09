# Tandoor MCP Server

A Model Context Protocol (MCP) server for managing Tandoor recipes and meal plans. This server allows you to list, create, and update recipes and meal plans in your Tandoor instance through MCP-compatible clients.

## Features

### Recipe Management
- **List Recipes**: Browse and search your recipe collection with filtering and pagination
- **Get Recipe**: Retrieve detailed information about a specific recipe including ingredients and steps
- **Create Recipe**: Add new recipes with full support for ingredients, steps, keywords, and metadata
- **Update Recipe**: Modify existing recipes (partial updates supported)

### Meal Planning
- **List Meal Plans**: View upcoming meals with date filtering
- **Get Meal Plan**: Get detailed information about a specific meal plan
- **Create Meal Plan**: Schedule recipes for specific dates and meal types
- **Update Meal Plan**: Modify existing meal plans
- **Delete Meal Plan**: Remove meal plans
- **Auto Meal Plan**: Automatically generate meal plans based on keywords
- **List Meal Types**: View available meal types (breakfast, lunch, dinner, etc.)

The server automatically handles:
- Creating foods/ingredients that don't exist in your Tandoor instance
- Creating units that don't exist
- Creating keywords that don't exist
- Proper structuring of recipe steps and ingredients

## Installation

```bash
npm install -g tandoor-mcp
```

Or use with npx:

```bash
npx tandoor-mcp
```

## Configuration

Create a `.env` file in your project directory with your Tandoor credentials:

```env
TANDOOR_URL=https://your-tandoor-instance.com
TANDOOR_TOKEN=your-api-token
```

To get your API token from Tandoor:
1. Log into your Tandoor instance
2. Go to Settings → API Tokens
3. Create a new token or use an existing one

## Usage

### With MCP Client

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "tandoor": {
      "command": "npx",
      "args": ["tandoor-mcp"],
      "env": {
        "TANDOOR_URL": "https://your-tandoor-instance.com",
        "TANDOOR_TOKEN": "your-api-token"
      }
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "tandoor": {
      "command": "tandoor-mcp"
    }
  }
}
```

### Common Usage Examples

#### Planning Your Week's Meals

1. **List available recipes to choose from:**
```
Use list_recipes to see what recipes are available
```

2. **Check available meal types:**
```
Use list_meal_types to see your configured meal types (breakfast, lunch, dinner, etc.)
```

3. **Create a meal plan for tonight:**
```
Use create_meal_plan with:
- recipe_id: 123 (ID from list_recipes)
- servings: 4
- from_date: "2025-12-15T18:00:00"
- meal_type_id: 2 (ID from list_meal_types)
- addshopping: true (to add ingredients to shopping list)
```

4. **Auto-plan a week of dinners:**
```
Use auto_meal_plan with:
- start_date: "2025-12-10"
- end_date: "2025-12-17"
- meal_type_id: 2
- keyword_ids: [5, 8, 12] (use keywords like "quick", "healthy", "vegetarian")
- servings: 4
```

#### Managing Recipes

1. **Search for pasta recipes:**
```
Use list_recipes with query: "pasta"
```

2. **Get full recipe details including ingredients:**
```
Use get_recipe with id: 123
```

3. **Add a new recipe:**
```
Use create_recipe with full recipe data (see tool documentation)
```

4. **Update recipe servings:**
```
Use update_recipe with id: 123 and servings: 6
```

## Available Tools

### Recipe Tools

#### list_recipes

List recipes with optional filtering and pagination.

**Parameters:**
- `page` (number, optional): Page number for pagination
- `page_size` (number, optional): Number of recipes per page
- `query` (string, optional): Search query to filter recipes by name
- `sort_order` (string, optional): Sort order (e.g., "name", "-name", "rating", "-rating")
- `rating_gte` (number, optional): Filter recipes with minimum rating

**Example:**
```json
{
  "query": "pasta",
  "page_size": 10,
  "sort_order": "-rating"
}
```

#### get_recipe

Get detailed information about a specific recipe.

**Parameters:**
- `id` (number, required): The ID of the recipe to retrieve

**Example:**
```json
{
  "id": 123
}
```

#### create_recipe

Create a new recipe with ingredients and steps.

**Parameters:**
- `name` (string, required): Name of the recipe
- `description` (string, optional): Description
- `servings` (number, optional): Number of servings
- `servings_text` (string, optional): Text description of servings
- `working_time` (number, optional): Working time in minutes
- `waiting_time` (number, optional): Waiting time in minutes
- `source_url` (string, optional): Source URL
- `keywords` (array of strings, optional): Keywords/tags
- `steps` (array, required): Recipe steps with ingredients
- `internal` (boolean, optional): Internal recipe flag
- `show_ingredient_overview` (boolean, optional): Show ingredient overview
- `private` (boolean, optional): Private recipe flag

**Example:**
```json
{
  "name": "Simple Pasta",
  "description": "A quick and easy pasta dish",
  "servings": 4,
  "working_time": 15,
  "waiting_time": 10,
  "keywords": ["pasta", "italian", "quick"],
  "steps": [
    {
      "instruction": "Boil water and cook pasta according to package directions",
      "time": 10,
      "ingredients": [
        {
          "food": "pasta",
          "amount": 400,
          "unit": "g"
        },
        {
          "food": "water",
          "amount": 2,
          "unit": "l"
        },
        {
          "food": "salt",
          "amount": 1,
          "unit": "tsp"
        }
      ]
    },
    {
      "instruction": "Drain and serve with your favorite sauce",
      "time": 5,
      "ingredients": [
        {
          "food": "tomato sauce",
          "amount": 200,
          "unit": "ml"
        }
      ]
    }
  ]
}
```

#### update_recipe

Update an existing recipe (partial update supported).

**Parameters:**
- `id` (number, required): ID of the recipe to update
- All other parameters from `create_recipe` are optional

**Example:**
```json
{
  "id": 123,
  "servings": 6,
  "working_time": 20
}
```

### Meal Planning Tools

#### list_meal_plans

List meal plans with optional filtering and pagination.

**Parameters:**
- `page` (number, optional): Page number for pagination
- `page_size` (number, optional): Number of meal plans per page
- `from_date` (string, optional): Start date for filtering (YYYY-MM-DD)
- `to_date` (string, optional): End date for filtering (YYYY-MM-DD)
- `meal_type` (array of numbers, optional): Filter by meal type IDs

**Example:**
```json
{
  "from_date": "2025-12-10",
  "to_date": "2025-12-17",
  "page_size": 20
}
```

#### get_meal_plan

Get detailed information about a specific meal plan.

**Parameters:**
- `id` (number, required): The ID of the meal plan to retrieve

**Example:**
```json
{
  "id": 456
}
```

#### create_meal_plan

Create a new meal plan entry.

**Parameters:**
- `recipe_id` (number, optional): Recipe ID to schedule
- `title` (string, optional): Title if not using a recipe
- `servings` (number, required): Number of servings
- `from_date` (string, required): Date for the meal (ISO 8601 format)
- `to_date` (string, optional): End date for multi-day meals
- `meal_type_id` (number, required): Meal type ID (use list_meal_types to get IDs)
- `note` (string, optional): Additional notes
- `addshopping` (boolean, optional): Add ingredients to shopping list

**Example:**
```json
{
  "recipe_id": 123,
  "servings": 4,
  "from_date": "2025-12-15T18:00:00",
  "meal_type_id": 2,
  "note": "Family dinner",
  "addshopping": true
}
```

#### update_meal_plan

Update an existing meal plan (partial update supported).

**Parameters:**
- `id` (number, required): ID of the meal plan to update
- All other parameters from `create_meal_plan` are optional

**Example:**
```json
{
  "id": 456,
  "servings": 6,
  "note": "Updated serving count"
}
```

#### delete_meal_plan

Delete a meal plan entry.

**Parameters:**
- `id` (number, required): ID of the meal plan to delete

**Example:**
```json
{
  "id": 456
}
```

#### auto_meal_plan

Automatically generate meal plans for a date range based on keywords.

**Parameters:**
- `start_date` (string, required): Start date (YYYY-MM-DD)
- `end_date` (string, required): End date (YYYY-MM-DD)
- `meal_type_id` (number, required): Meal type ID
- `keyword_ids` (array of numbers, required): Keyword IDs to filter recipes
- `servings` (number, required): Number of servings per meal
- `addshopping` (boolean, optional): Add ingredients to shopping list

**Example:**
```json
{
  "start_date": "2025-12-10",
  "end_date": "2025-12-17",
  "meal_type_id": 2,
  "keyword_ids": [1, 5, 8],
  "servings": 4,
  "addshopping": false
}
```

#### list_meal_types

List all available meal types (breakfast, lunch, dinner, etc.).

**Parameters:** None

**Example:**
```json
{}
```

## Development

### Setup

```bash
git clone <repository>
cd tandoor-mcp
npm install
```

### Build

```bash
npm run build
```

### Watch mode

```bash
npm run watch
```

## Project Structure

```
tandoor-mcp/
├── src/
│   ├── index.ts           # Main MCP server implementation
│   ├── types/
│   │   ├── common.ts      # Common types (User, Config)
│   │   ├── recipe.ts      # Recipe-related types
│   │   ├── mealplan.ts    # Meal plan types
│   │   └── index.ts       # Type exports
│   ├── clients/
│   │   ├── base.ts        # Base HTTP client with error handling
│   │   ├── recipe.ts      # Recipe API methods
│   │   ├── mealplan.ts    # Meal plan API methods
│   │   └── index.ts       # Main Tandoor client
│   ├── tools/
│   │   ├── recipe.ts      # Recipe tool definitions
│   │   └── mealplan.ts    # Meal plan tool definitions
│   └── handlers/
│       ├── recipe.ts      # Recipe request handlers
│       └── mealplan.ts    # Meal plan request handlers
├── build/                 # Compiled JavaScript output
├── package.json
├── tsconfig.json
└── .env                   # Configuration (not in git)
```

## API Token Authentication

This server uses bearer token authentication with the Tandoor API. Make sure your API token has the necessary permissions to:
- Read recipes
- Create recipes
- Update recipes
- Create foods/ingredients
- Create units
- Create keywords
- Read meal plans
- Create meal plans
- Update meal plans
- Delete meal plans
- Read meal types

## License

MIT
