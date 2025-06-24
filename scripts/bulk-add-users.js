// scripts/bulk-add-users.js
// PROJECT_BEST_PRACTICES: Safe, idempotent test data script for MongoDB
// - Only adds new users (unique email)
// - Assigns 'User' or 'Admin' roles randomly
// - Simple passwords for testing
// - Logs all changes, does not overwrite existing users
//
// Usage: node scripts/bulk-add-users.js

const { MongoClient } = require('mongodb');

const MONGO_URI = 
const DB_NAME = 'okr_app_ws';
const USERS_COLLECTION = 'users';
const NUM_USERS = 12; // Adjust as needed
const SIMPLE_PASSWORD = 'test1234';
const ROLES = ['User', 'Admin'];

function randomRole() {
  return ROLES[Math.floor(Math.random() * ROLES.length)];
}

async function main() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const users = db.collection(USERS_COLLECTION);

    let inserted = 0;
    for (let i = 1; i <= NUM_USERS; i++) {
      const email = `testuser${i}@example.com`;
      const existing = await users.findOne({ email });
      if (!existing) {
        await users.insertOne({
          name: `Test User ${i}`,
          email,
          password: SIMPLE_PASSWORD,
          role: randomRole(),
          department: '-',
          designation: '-',
          okrsCount: Math.floor(Math.random() * 6),
        });
        inserted++;
      }
    }
    console.log(`[bulk-add-users] Inserted ${inserted} new test users.`);
  } catch (err) {
    console.error('[bulk-add-users] Failed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
