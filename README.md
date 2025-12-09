# Tandoor MCP Server

Model Context Protocol (MCP) server for [Tandoor](https://github.com/TandoorRecipes/recipes) recipe and meal plan management.

> **Note:** This project was partially developed with the assistance of Large Language Models (LLMs).

## Features

- **Recipe Management** - List, get, create, and update recipes
- **Meal Planning** - Create, manage, and auto-generate meal plans
- **Auto-creation** - Automatically creates missing ingredients, units, and keywords

## Installation

```bash
npm install -g tandoor-mcp
```

Or use with npx:

```bash
npx tandoor-mcp
```

## Configuration

1. Get your API token from Tandoor:
   - Settings → API Tokens → Create new token

2. Configure MCP client (e.g., Claude Desktop):

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

## Available Tools

### Recipe Tools
- `list_recipes` - Browse recipes with filtering
- `get_recipe` - Get recipe details
- `create_recipe` - Add new recipes with steps and ingredients
- `update_recipe` - Update existing recipes

### Meal Planning Tools
- `list_meal_plans` - View scheduled meals
- `get_meal_plan` - Get meal plan details
- `create_meal_plan` - Schedule a recipe
- `update_meal_plan` - Update meal plans
- `delete_meal_plan` - Remove meal plans
- `auto_meal_plan` - Auto-generate meal plans by keywords
- `list_meal_types` - List meal types (breakfast, lunch, etc.)

## Development

```bash
git clone https://github.com/mc-mario/tandoor-mcp.git
cd tandoor-mcp
npm install
npm run build
```

## License

MIT
