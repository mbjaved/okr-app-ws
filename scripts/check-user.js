const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkUser(email) {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set in .env.local');
    process.exit(1);
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'okr-app');
    
    const user = await db.collection('users').findOne({ 
      email: email.toLowerCase() 
    });
    
    if (!user) {
      console.log('❌ No user found with email:', email);
      return;
    }
    
    console.log('✅ User found:', JSON.stringify(user, null, 2));
    console.log('🔑 User has password field:', 'password' in user);
    
    if (user.password) {
      console.log('🔒 Password is hashed:', user.password.startsWith('$2a$'));
    }
    
  } catch (error) {
    console.error('❌ Error checking user:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

// Get email from command line argument or use default
const email = process.argv[2] || 'mbj02@gmail.com';
console.log(`🔍 Checking user: ${email}`);
checkUser(email);
