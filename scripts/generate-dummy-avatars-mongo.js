// Script: generate-dummy-avatars-mongo.js
// Best Practice: Deterministic avatars for all users in DB (modular, extensible, timeline compliant)
// Usage: node scripts/generate-dummy-avatars-mongo.js

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const Avatars = require('@dicebear/avatars').default;
const IdenticonSprites = require('@dicebear/avatars-identicon-sprites').default;

// --- CONFIGURATION ---
const MONGO_URI = "mongodb+srv://muhammadjaved:mZ24bA3F8dzJbbG9@cluster-mbj.ldoet.mongodb.net/okr_app_ws?retryWrites=true&w=majority&appName=cluster-mbj";
const DB_NAME = 'okr_app_ws'; // Change if your DB name differs
const USERS_COLLECTION = 'users';
const OUTPUT_DIR = path.join(__dirname, '../public/avatars');

async function main() {
  const client = new MongoClient(MONGO_URI, { useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const users = await db.collection(USERS_COLLECTION).find({}).toArray();

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const avatars = new Avatars(IdenticonSprites, {});
    let count = 0;
    for (const user of users) {
      // Use username if present, else fallback to email prefix
      const username = user.username || (user.email && user.email.split('@')[0]);
      if (!username) continue;
      const svg = avatars.create(username);
      const filePath = path.join(OUTPUT_DIR, `${username}.svg`);
      fs.writeFileSync(filePath, svg, 'utf8');
      console.log(`Generated avatar for ${username}: ${filePath}`);
      count++;
    }
    console.log(`Dummy avatars generated for ${count} users!`);
  } catch (err) {
    console.error('Error generating avatars:', err);
  } finally {
    await client.close();
  }
}

main();
