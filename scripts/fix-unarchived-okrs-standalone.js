// fix-unarchived-okrs-standalone.js
// Usage: node scripts/fix-unarchived-okrs-standalone.js

require('dotenv').config();
const { MongoClient } = require('mongodb');


// TODO: Replace with your actual MongoDB connection string
const uri = "mongodb+srv://muhammadjaved:mZ24bA3F8dzJbbG9@cluster-mbj.ldoet.mongodb.net/okr_app_ws?retryWrites=true&w=majority&appName=cluster-mbj"; // or from your .env
console.log("MongoDB URI:", uri);
const dbName = 'okr-app'; // Change this if your DB name is different

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const okrs = db.collection('okrs');
    const result = await okrs.updateMany(
      { status: 'active', departmentId: '' },
      { $unset: { departmentId: '' } }
    );
    console.log(`Fixed ${result.modifiedCount} OKRs.`);
  } finally {
    await client.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
