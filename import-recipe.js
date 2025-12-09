#!/usr/bin/env node

// Script to import a recipe from another service format to Tandoor
import dotenv from 'dotenv';
import { TandoorClient } from './build/client.js';

dotenv.config();

const TANDOOR_URL = process.env.TANDOOR_URL;
const TANDOOR_TOKEN = process.env.TANDOOR_TOKEN;

if (!TANDOOR_URL || !TANDOOR_TOKEN) {
  console.error('Error: TANDOOR_URL and TANDOOR_TOKEN must be set in .env file');
  process.exit(1);
}

const tandoorClient = new TandoorClient({
  url: TANDOOR_URL,
  token: TANDOOR_TOKEN,
});

/**
 * Convert external recipe format to Tandoor format
 */
function convertRecipe(externalRecipe) {
  // Parse description into steps
  const stepTexts = externalRecipe.description
    .split(/\d+\.\s+/)
    .filter(s => s.trim().length > 0)
    .map(s => s.trim());

  // Group ingredients by step
  // For simplicity, we'll put all ingredients in the first step
  // and create additional steps without ingredients
  const ingredients = externalRecipe.items.map((item, index) => {
    // Parse amount and unit from description
    let amount = 1;
    let unit = '';
    
    if (item.description) {
      const desc = item.description.trim();
      // Try to parse number and unit (e.g., "320g", "1L", "2")
      const match = desc.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]*)$/);
      if (match) {
        amount = parseFloat(match[1]);
        unit = match[2] || '';
      } else if (!isNaN(desc)) {
        amount = parseFloat(desc);
      }
    }

    return {
      food: item.name,
      amount: amount,
      unit: unit || undefined,
      order: index,
    };
  });

  // Create steps
  const steps = stepTexts.map((instruction, index) => {
    return {
      instruction: instruction,
      order: index,
      // Add ingredients only to the first step
      ingredients: index === 0 ? ingredients : [],
    };
  });

  // Convert tags to keywords
  const keywords = externalRecipe.tags.map(tag => tag.name);

  return {
    name: externalRecipe.name,
    description: `Source: ${externalRecipe.source || 'Unknown'}`,
    servings: externalRecipe.yields || 4,
    working_time: externalRecipe.time || 0,
    waiting_time: 0,
    keywords: keywords,
    steps: steps,
    internal: false,
    show_ingredient_overview: true,
  };
}

async function importRecipe(externalRecipe) {
  try {
    console.log(`Converting recipe: ${externalRecipe.name}`);
    console.log(`  - ${externalRecipe.items.length} ingredients`);
    console.log(`  - ${externalRecipe.tags.length} tags`);
    console.log(`  - Time: ${externalRecipe.time} minutes`);
    console.log(`  - Servings: ${externalRecipe.yields}`);
    
    const tandoorRecipe = convertRecipe(externalRecipe);
    
    console.log('\nConverted recipe structure:');
    console.log(`  - ${tandoorRecipe.steps.length} steps`);
    console.log(`  - ${tandoorRecipe.keywords.length} keywords`);
    
    console.log('\nProcessing ingredients and keywords...');
    
    // Process keywords first
    const processedKeywords = [];
    for (const keywordName of tandoorRecipe.keywords) {
      console.log(`  Finding/creating keyword: ${keywordName}`);
      const keyword = await tandoorClient.findOrCreateKeyword(keywordName);
      processedKeywords.push(keyword);
    }
    
    // Process steps and ingredients
    const processedSteps = [];
    for (let i = 0; i < tandoorRecipe.steps.length; i++) {
      const step = tandoorRecipe.steps[i];
      const processedIngredients = [];
      
      for (let j = 0; j < step.ingredients.length; j++) {
        const ing = step.ingredients[j];
        console.log(`  Finding/creating food: ${ing.food}`);
        const food = await tandoorClient.findOrCreateFood(ing.food);
        
        let unit = null;
        if (ing.unit) {
          console.log(`  Finding/creating unit: ${ing.unit}`);
          unit = await tandoorClient.findOrCreateUnit(ing.unit);
        }
        
        processedIngredients.push({
          food: food,
          unit: unit,
          amount: ing.amount,
          order: ing.order,
        });
      }
      
      processedSteps.push({
        instruction: step.instruction,
        order: step.order,
        ingredients: processedIngredients,
        time: 0,
      });
    }
    
    const finalRecipe = {
      ...tandoorRecipe,
      keywords: processedKeywords,
      steps: processedSteps,
    };
    
    console.log('\nCreating recipe in Tandoor...');
    const created = await tandoorClient.createRecipe(finalRecipe);
    
    console.log('\n✓ Recipe created successfully!');
    console.log(`  Recipe ID: ${created.id}`);
    console.log(`  Name: ${created.name}`);
    console.log(`  View at: ${TANDOOR_URL}/view/recipe/${created.id}`);
    
    return created;
    
  } catch (error) {
    console.error('\n✗ Error creating recipe:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Example recipe from your data
const exampleRecipe = {
  "cook_time": 0,
  "created_at": 1727911824554,
  "description": "1. Freir chorizo y morcilla y dejar en un papel para que absorba el aceite. No hace falta que se quede muy frito, ya que se finaliza en la cacerola con el arroz.\n2. Sofreír ajos. \n3. Añadir el tomate triturado a los ajos con un par de hojas de laurel.\n4. Esperar a que el tomate esté bien sofrito..\n5. Añadir el caldo y azafrán, cuando esté hirviendo el caldo pones el arroz.\n6. Unos minutos después ponemos los garbanzos.\n7. Cuando le quede 5 minutos de cocción al arroz añadir el chorizo y la morcilla.",
  "household": {
    "description": null,
    "id": 1,
    "language": "es",
    "link": null,
    "name": "Casa",
    "photo": null,
    "verified": null
  },
  "household_id": 1,
  "id": 2,
  "items": [
    {
      "category_id": null,
      "created_at": 1727912017355,
      "default": false,
      "default_key": null,
      "description": "2",
      "household_id": 1,
      "icon": null,
      "id": 483,
      "name": "Ajos",
      "optional": false,
      "ordering": 48,
      "support": 0.016129032258064516,
      "updated_at": 1727912155653
    },
    {
      "category": {
        "created_at": 1727870648575,
        "default": true,
        "default_key": "grain",
        "household_id": 1,
        "id": 10,
        "name": "🥟 Pasta y fideos",
        "ordering": 0,
        "updated_at": 1727870648576
      },
      "category_id": 10,
      "created_at": 1727911824567,
      "default": true,
      "default_key": "rice",
      "description": "320g",
      "household_id": 1,
      "icon": "grains-of-rice",
      "id": 341,
      "name": "Arroz",
      "optional": false,
      "ordering": 185,
      "support": 0.06451612903225806,
      "updated_at": 1727912155728
    },
    {
      "category": {
        "created_at": 1727870648306,
        "default": true,
        "default_key": "canned",
        "household_id": 1,
        "id": 7,
        "name": "🥫 Conservas",
        "ordering": 0,
        "updated_at": 1727870648306
      },
      "category_id": 7,
      "created_at": 1727912017279,
      "default": false,
      "default_key": "chicken_broth",
      "description": "1L",
      "household_id": 1,
      "icon": "can_soup",
      "id": 480,
      "name": "Caldo de Pollo",
      "optional": false,
      "ordering": 1,
      "support": 0.08064516129032258,
      "updated_at": 1727912155667
    },
    {
      "category": {
        "created_at": 1727870648535,
        "default": true,
        "default_key": "refrigerated",
        "household_id": 1,
        "id": 9,
        "name": "💧 Refrigerados",
        "ordering": 0,
        "updated_at": 1727870648535
      },
      "category_id": 9,
      "created_at": 1727912017306,
      "default": false,
      "default_key": null,
      "description": "2",
      "household_id": 1,
      "icon": null,
      "id": 481,
      "name": "Chorizo",
      "optional": false,
      "ordering": 193,
      "support": 0.08064516129032258,
      "updated_at": 1727912155679
    },
    {
      "category": {
        "created_at": 1727870648306,
        "default": true,
        "default_key": "canned",
        "household_id": 1,
        "id": 7,
        "name": "🥫 Conservas",
        "ordering": 0,
        "updated_at": 1727870648306
      },
      "category_id": 7,
      "created_at": 1727912017370,
      "default": true,
      "default_key": "chickpeas",
      "description": "",
      "household_id": 1,
      "icon": "peas",
      "id": 75,
      "name": "Garbanzos",
      "optional": false,
      "ordering": 189,
      "support": 0.0967741935483871,
      "updated_at": 1727912017370
    },
    {
      "category": {
        "created_at": 1727870648306,
        "default": true,
        "default_key": "canned",
        "household_id": 1,
        "id": 7,
        "name": "🥫 Conservas",
        "ordering": 0,
        "updated_at": 1727870648306
      },
      "category_id": 7,
      "created_at": 1727912017394,
      "default": true,
      "default_key": "saffron_threads",
      "description": "",
      "household_id": 1,
      "icon": "natural_food",
      "id": 353,
      "name": "Hilos de azafrán",
      "optional": false,
      "ordering": 47,
      "support": 0.016129032258064516,
      "updated_at": 1727912017394
    },
    {
      "category": {
        "created_at": 1727870648306,
        "default": true,
        "default_key": "canned",
        "household_id": 1,
        "id": 7,
        "name": "🥫 Conservas",
        "ordering": 0,
        "updated_at": 1727870648306
      },
      "category_id": 7,
      "created_at": 1727912017381,
      "default": true,
      "default_key": "bay_leaf",
      "description": "",
      "household_id": 1,
      "icon": "natural_food",
      "id": 32,
      "name": "Hoja de laurel",
      "optional": false,
      "ordering": 49,
      "support": 0.03225806451612903,
      "updated_at": 1727912017382
    },
    {
      "category": {
        "created_at": 1727870648535,
        "default": true,
        "default_key": "refrigerated",
        "household_id": 1,
        "id": 9,
        "name": "💧 Refrigerados",
        "ordering": 0,
        "updated_at": 1727870648535
      },
      "category_id": 9,
      "created_at": 1727911885965,
      "default": false,
      "default_key": null,
      "description": "2",
      "household_id": 1,
      "icon": null,
      "id": 479,
      "name": "Morcilla",
      "optional": false,
      "ordering": 212,
      "support": 0.08064516129032258,
      "updated_at": 1727912155709
    },
    {
      "category": {
        "created_at": 1727870648306,
        "default": true,
        "default_key": "canned",
        "household_id": 1,
        "id": 7,
        "name": "🥫 Conservas",
        "ordering": 0,
        "updated_at": 1727870648306
      },
      "category_id": 7,
      "created_at": 1727912017331,
      "default": false,
      "default_key": null,
      "description": "",
      "household_id": 1,
      "icon": "tomato",
      "id": 482,
      "name": "Tomate frito",
      "optional": false,
      "ordering": 123,
      "support": 0.12903225806451613,
      "updated_at": 1727912017331
    }
  ],
  "name": "Arroz Empedrado",
  "photo": null,
  "planned": false,
  "planned_cooking_dates": [],
  "planned_days": [],
  "prep_time": 0,
  "server_curated": false,
  "server_scrapes": 0,
  "source": "Mamá",
  "suggestion_rank": 17,
  "suggestion_score": 2,
  "tags": [
    {
      "created_at": 1728121529062,
      "household_id": 1,
      "id": 4,
      "name": "Comida",
      "updated_at": 1728121529062
    },
    {
      "created_at": 1728121529093,
      "household_id": 1,
      "id": 1,
      "name": "Laborioso",
      "updated_at": 1728121529093
    }
  ],
  "time": 90,
  "updated_at": 1765249202704,
  "visibility": 0,
  "yields": 4
};

// Run the import
importRecipe(exampleRecipe);
