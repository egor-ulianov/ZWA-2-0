import { neon } from '@neondatabase/serverless';
import { getServerEnv } from './env.js';

let client;

export function getDb() {
  if (!client) client = neon(getServerEnv().databaseUrl);
  return client;
}

export function setDbForTests(value) {
  client = value;
}
