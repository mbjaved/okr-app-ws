const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Test credentials
const TEST_EMAIL = 'mbj01@gmail.com';
const TEST_PASSWORD = 'password123'; // Replace with actual test password

async function testLogin() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in .env.local');
    process.exit(1);
  }

  const dbName = new URL(process.env.MONGODB_URI).pathname.replace(/^\//, '');
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(dbName);

    console.log(`🔍 Looking up user: ${TEST_EMAIL}`);
    const user = await db.collection('users').findOne({
      email: { $regex: new RegExp(`^${TEST_EMAIL}$`, 'i') }
    });

    if (!user) {
      console.error('❌ User not found');
      process.exit(1);
    }

    console.log('✅ User found:', {
      email: user.email,
      name: user.name,
      role: user.role,
      hasPassword: !!user.password
    });

    if (!user.password) {
      console.error('❌ User has no password set');
      process.exit(1);
    }

    console.log('🔑 Comparing passwords...');
    const isMatch = await bcrypt.compare(TEST_PASSWORD, user.password);
    
    if (isMatch) {
      console.log('✅ Password matches!');
      console.log('\n🎉 Authentication successful!');
      console.log('You should now be able to log in with these credentials.');
    } else {
      console.error('❌ Incorrect password');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error during test:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

testLogin().catch(console.error);
