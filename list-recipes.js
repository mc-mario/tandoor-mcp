#!/usr/bin/env node
import dotenv from 'dotenv';
import { TandoorClient } from './build/client.js';

dotenv.config();

const tandoorClient = new TandoorClient({
  url: process.env.TANDOOR_URL,
  token: process.env.TANDOOR_TOKEN,
});

async function listRecipes() {
  try {
    console.log('Fetching recipes...\n');
    const result = await tandoorClient.listRecipes({ page_size: 10 });
    
    console.log(`Total recipes: ${result.count}`);
    console.log(`Showing: ${result.results.length} recipes\n`);
    console.log('='.repeat(60));
    
    result.results.forEach((recipe, i) => {
      console.log(`\n${i + 1}. ${recipe.name} (ID: ${recipe.id})`);
      if (recipe.description) {
        const desc = recipe.description.substring(0, 60);
        console.log(`   ${desc}${recipe.description.length > 60 ? '...' : ''}`);
      }
      console.log(`   Servings: ${recipe.servings || 'N/A'} | Time: ${recipe.working_time || 0} min`);
      if (recipe.keywords && recipe.keywords.length > 0) {
        console.log(`   Keywords: ${recipe.keywords.map(k => k.label).join(', ')}`);
      }
    });
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listRecipes();
