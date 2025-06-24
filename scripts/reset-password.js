const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Configuration
const USER_EMAIL = 'mbj01@gmail.com';
const NEW_PASSWORD = 'newSecurePassword123'; // Change this to a secure password
const SALT_ROUNDS = 10;

async function resetPassword() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in .env.local');
    process.exit(1);
  }

  const dbName = new URL(process.env.MONGODB_URI).pathname.replace(/^\//, '');
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(dbName);

    console.log(`🔍 Looking up user: ${USER_EMAIL}`);
    const user = await db.collection('users').findOne({
      email: { $regex: new RegExp(`^${USER_EMAIL}$`, 'i') }
    });

    if (!user) {
      console.error('❌ User not found');
      process.exit(1);
    }

    console.log('🔑 Hashing new password...');
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, SALT_ROUNDS);

    console.log('🔄 Updating user password...');
    const result = await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );

    if (result.modifiedCount === 1) {
      console.log('✅ Password updated successfully!');
      console.log(`📧 Email: ${USER_EMAIL}`);
      console.log(`🔑 New password: ${NEW_PASSWORD}`);
      console.log('\n⚠️  Please change this password after logging in!');
    } else {
      console.error('❌ Failed to update password');
    }

  } catch (error) {
    console.error('❌ Error during password reset:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Ask for confirmation before resetting password
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('Are you sure you want to reset the password? (yes/no) ', async (answer) => {
  if (answer.toLowerCase() === 'yes') {
    await resetPassword();
  } else {
    console.log('Password reset cancelled');
  }
  readline.close();
});
