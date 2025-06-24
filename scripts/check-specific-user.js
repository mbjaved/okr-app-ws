const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkSpecificUser(email) {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in .env.local');
    process.exit(1);
  }

  console.log('🔍 Checking user:', email);
  console.log('🔗 Using database: okr_app_ws');
  
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('okr_app_ws');
    
    // Check user by email (case insensitive)
    const user = await db.collection('users').findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });
    
    if (!user) {
      console.log('❌ User not found in okr_app_ws database');
      
      // Check if email exists with different case
      const allUsers = await db.collection('users')
        .find({})
        .project({ email: 1, name: 1, _id: 1 })
        .toArray();
        
      console.log('\n👥 All users in database:');
      allUsers.forEach(u => {
        console.log(`- ${u.email} (${u.name}) [${u._id}]`);
      });
      
      return;
    }
    
    console.log('✅ User found:', {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      hasPassword: !!user.password,
      passwordStartsWith: user.password ? user.password.substring(0, 10) + '...' : 'No password',
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
    
    // Check if password is hashed
    if (user.password) {
      console.log('\n🔑 Password details:', {
        isBcrypt: user.password.startsWith('$2a$') || user.password.startsWith('$2b$'),
        length: user.password.length
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking user:', error);
  } finally {
    await client.close();
  }
}

// Get email from command line argument or use default
const email = process.argv[2] || 'mbj02@gmail.com';
checkSpecificUser(email).catch(console.error);
