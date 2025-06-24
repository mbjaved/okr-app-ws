const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in .env.local');
    process.exit(1);
  }

  console.log('🔌 Testing MongoDB connection...');
  console.log('🔗 Connection string:', process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
  
  const dbName = process.env.MONGODB_DB || 'okr-app';
  console.log('📂 Database name:', dbName);

  const client = new MongoClient(process.env.MONGODB_URI, {
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000,
  });

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Successfully connected to MongoDB');

    // List all databases
    console.log('\n🔍 Listing all databases in the cluster:');
    const adminDb = client.db('admin').admin();
    const dbList = await adminDb.listDatabases();
    
    let foundUsers = false;
    
    // Check each database for users collection
    for (const dbInfo of dbList.databases) {
      const dbName = dbInfo.name;
      console.log(`\n📂 Database: ${dbName}`);
      
      try {
        const db = client.db(dbName);
        const collections = await db.listCollections().toArray();
        
        if (collections.length === 0) {
          console.log('  No collections found');
          continue;
        }
        
        console.log('  Collections:');
        collections.forEach(collection => {
          console.log(`  - ${collection.name}`);
        });
        
        // Check for users collection
        if (collections.some(c => c.name === 'users')) {
          const users = await db.collection('users').find({}).toArray();
          console.log(`  👥 Found ${users.length} users in this database`);
          
          if (users.length > 0) {
            foundUsers = true;
            console.log('  📝 First user:');
            console.log('  ' + JSON.stringify({
              _id: users[0]._id,
              email: users[0].email,
              name: users[0].name,
              role: users[0].role,
              hasPassword: !!users[0].password
            }, null, 2).replace(/\n/g, '\n  '));
          }
        }
      } catch (err) {
        console.error(`  ❌ Error accessing database ${dbName}:`, err.message);
      }
    }
    
    if (!foundUsers) {
      console.log('\n❌ No users found in any database. Make sure your user data is in the correct database.');
    }

  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    if (error.message.includes('bad auth')) {
      console.error('🔐 Authentication failed. Please check your username and password.');
    } else if (error.message.includes('getaddrinfo')) {
      console.error('🌐 Network error. Please check your internet connection and MongoDB server status.');
    } else if (error.message.includes('timed out')) {
      console.error('⏱ Connection timed out. Please check if the MongoDB server is running and accessible.');
    }
  } finally {
    await client.close();
    process.exit(0);
  }
}

testConnection();
