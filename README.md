# Tandoor MCP Server

Model Context Protocol (MCP) server for [Tandoor](https://github.com/TandoorRecipes/recipes) recipe and meal plan management.

> **Note:** This project was partially developed with the assistance of Large Language Models (LLMs).

## Features

- **Recipe Management** - List, get, create, update, and delete recipes
- **Meal Planning** - Create, manage, and auto-generate meal plans
- **Shopping List** - Read the current shopping list
- **Reference Data** - List foods, units, and keywords (find IDs before creating)
- **Auto-creation** - Automatically creates missing ingredients, units, and keywords
- **Auto-pagination** - All list tools fetch every page (Tandoor defaults to 25 items/page, which silently truncates larger collections)
- **Compact output** - Recipe/meal-plan responses are summarized instead of dumping raw nested JSON, keeping token usage low

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
- `list_recipes` - List ALL recipes (auto-paginated). Filters: `query`, `keywords` (IDs), `rating_gte`, `sort_order`. Returns compact rows (id, name, keywords, servings)
- `get_recipe` - Get recipe details as a compact summary (steps with ingredients as text lines)
- `create_recipe` - Add new recipes. Food/unit/keyword names are auto-resolved to existing records when possible (normalized matching incl. Spanish singular/plural variants). Response reports any new records created so the caller can spot duplicates. Recipes are created visible in the UI (`internal: false`)
- `update_recipe` - Update metadata and/or content. **Providing `steps` replaces the whole steps array** — include every step
- `delete_recipe` - Permanently delete a recipe
- `list_foods` - List foods (optional `query` filter) — use before creating recipes to reuse existing foods
- `list_units` - List units (optional `query` filter)
- `list_keywords` - List keywords (optional `query` filter) — use to find keyword IDs

### Meal Planning Tools
- `list_meal_plans` - View scheduled meals (auto-paginated). With a date window, only entries **starting inside** the window are returned (Tandoor's API also returns overlapping entries from other weeks, which are filtered out)
- `get_meal_plan` - Get meal plan details
- `create_meal_plan` - Schedule a recipe (`addshopping: true` adds ingredients to the shopping list)
- `update_meal_plan` - Update meal plans
- `delete_meal_plan` - Remove meal plans
- `auto_meal_plan` - Auto-generate meal plans by keywords
- `list_meal_types` - List meal types (breakfast, lunch, etc.)
- `get_shopping_list` - Current shopping list entries (id, food, amount, unit, checked)

## Testing

End-to-end tests exercise every tool against a real Tandoor instance, create a temporary recipe + meal plan, and assert the database is left untouched (food/unit/keyword counts unchanged):

```bash
npm run build
TANDOOR_URL=https://your-tandoor-instance.com TANDOOR_TOKEN=your-token node test/e2e.mjs
```

## Development

```bash
git clone https://github.com/mc-mario/tandoor-mcp.git
cd tandoor-mcp
npm install
npm run build
```

## License

MIT
