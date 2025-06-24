const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkDatabase() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in .env.local');
    process.exit(1);
  }

  const dbName = new URL(process.env.MONGODB_URI).pathname.replace(/^\//, '');
  console.log('🔌 Connecting to database:', dbName);

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(dbName);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📂 Collections in database:');
    console.log(collections.map(c => `- ${c.name}`).join('\n'));

    // Check users collection
    const users = await db.collection('users').find().limit(1).toArray();
    console.log('\n👤 Sample user:', users[0] ? 'Found' : 'No users found');
    
    // Check okrs collection
    const okrs = await db.collection('okrs').find().limit(1).toArray();
    console.log('📝 Sample OKR:', okrs[0] ? 'Found' : 'No OKRs found');
    
    // Check keyresults collection
    const keyResults = await db.collection('keyresults').find().limit(1).toArray();
    console.log('🎯 Sample Key Result:', keyResults[0] ? 'Found' : 'No Key Results found');

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await client.close();
  }
}

checkDatabase().catch(console.error);
