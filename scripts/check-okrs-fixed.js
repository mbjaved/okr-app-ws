const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkOKRs() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in .env.local');
    process.exit(1);
  }

  const dbName = new URL(process.env.MONGODB_URI).pathname.replace(/^\//, '');
  console.log('🔌 Connecting to database:', dbName);

  const client = new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
  });

  try {
    await client.connect();
    const db = client.db(dbName);
    
    // 1. List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📂 Collections in database:');
    console.log(collections.map(c => `- ${c.name}`).join('\n'));

    // 2. Check if 'okrs' collection exists
    const hasOKRs = collections.some(c => c.name === 'okrs');
    console.log('\n🔍 OKRs collection exists:', hasOKRs);

    if (hasOKRs) {
      // 3. Count documents in okrs collection
      const count = await db.collection('okrs').countDocuments();
      console.log(`\n📊 Number of OKRs: ${count}`);

      // 4. Get one sample OKR
      if (count > 0) {
        const sampleOKR = await db.collection('okrs').findOne();
        console.log('\n📝 Sample OKR:');
        console.log(JSON.stringify(sampleOKR, null, 2));

        // 5. Test the dashboard query with the sample user
        const userId = sampleOKR.userId || sampleOKR.ownerId;
        if (userId) {
          console.log(`\n🔎 Testing dashboard query for user: ${userId}`);
          const okrs = await db.collection('okrs')
            .find({
              $or: [
                { ownerId: userId },
                { 'teamMembers.userId': userId }
              ],
              status: { $ne: 'archived' }
            })
            .toArray();
          
          console.log(`✅ Found ${okrs.length} OKRs for this user`);
          if (okrs.length > 0) {
            console.log('Sample OKR from query:', JSON.stringify(okrs[0], null, 2));
          }
        } else {
          console.log('⚠️ Could not find userId in sample OKR');
        }
      }

      // 6. Check for non-archived OKRs
      const activeOKR = await db.collection('okrs')
        .findOne({ status: { $ne: 'archived' } });
      
      if (activeOKR) {
        console.log('\n✅ Found non-archived OKR for testing');
      } else {
        console.log('\n⚠️ No non-archived OKRs found');
      }
    }
  } catch (error) {
    console.error('❌ Error checking OKRs:', error);
  } finally {
    await client.close();
  }
}

checkOKRs().catch(console.error);
