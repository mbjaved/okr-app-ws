// scripts/add-role-to-users.js
// PROJECT_BEST_PRACTICES: Safe, idempotent migration script for MongoDB
// - Defensive: Only updates users missing the 'role' field
// - Transparent: Logs changes, does not overwrite existing roles
// - Reversible: Only adds a default, does not remove or alter existing data
// - Traceable: Use with npm run-script, log output for audit
//
// Usage: node scripts/add-role-to-users.js

const { MongoClient } = require('mongodb');

const MONGO_URI = "mongodb+srv://muhammadjaved:mZ24bA3F8dzJbbG9@cluster-mbj.ldoet.mongodb.net/okr_app_ws?retryWrites=true&w=majority&appName=cluster-mbj"
const DB_NAME = 'okr_app_ws'; // Update if your DB name is different
const USERS_COLLECTION = 'users';
const DEFAULT_ROLE = 'User';

async function main() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const users = db.collection(USERS_COLLECTION);

    // Find users missing the 'role' field
    const filter = { role: { $exists: false } };
    const update = { $set: { role: DEFAULT_ROLE } };
    const result = await users.updateMany(filter, update);

    console.log(`[add-role-to-users] Updated ${result.modifiedCount} users to have role: '${DEFAULT_ROLE}'.`);
  } catch (err) {
    console.error('[add-role-to-users] Migration failed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
