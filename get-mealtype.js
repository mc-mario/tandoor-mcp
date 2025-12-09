import dotenv from 'dotenv';
import { TandoorClient } from './build/clients/index.js';

dotenv.config();

const tandoorClient = new TandoorClient({
  url: process.env.TANDOOR_URL,
  token: process.env.TANDOOR_TOKEN,
});

async function test() {
  const types = await tandoorClient.mealPlans.listMealTypes();
  console.log(JSON.stringify(types, null, 2));
}
test();
