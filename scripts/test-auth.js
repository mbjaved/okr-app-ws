const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testAuth() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in .env.local');
    process.exit(1);
  }

  const dbName = new URL(process.env.MONGODB_URI).pathname.replace(/^\//, '');
  console.log('🔌 Testing connection to database:', dbName);

  const client = new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
  });

  try {
    // Test connection
    await client.connect();
    console.log('✅ Successfully connected to MongoDB');

    // Test database access
    const db = client.db(dbName);
    await db.command({ ping: 1 });
    console.log('✅ Database ping successful');

    // Check users collection
    const users = await db.collection('users').find({}).toArray();
    console.log(`👥 Found ${users.length} users in the database`);
    
    if (users.length > 0) {
      console.log('Sample user:', {
        email: users[0].email,
        name: users[0].name,
        role: users[0].role,
        hasPassword: !!users[0].password
      });
    }

  } catch (error) {
    console.error('❌ Error during test:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

testAuth().catch(console.error);
