// migrate-key-results-progress.js
// This script updates all OKRs in the database so that each keyResult is normalized to the new model:
// { title, type: 'percent' | 'target', progress, current, target, unit }
// Usage: node scripts/migrate-key-results-progress.js

const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://muhammadjaved:mZ24bA3F8dzJbbG9@cluster-mbj.ldoet.mongodb.net/okr_app_ws?retryWrites=true&w=majority&appName=cluster-mbj";
const dbName = 'okr-app'; // Change if needed

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const okrs = db.collection('okrs');
    const allOkrs = await okrs.find({}).toArray();
    let updatedCount = 0;
    for (const okr of allOkrs) {
      let changed = false;
      const newKRs = (okr.keyResults || []).map(kr => {
        // If already migrated, skip
        if (kr.type && (kr.type === 'percent' || kr.type === 'target')) return kr;
        // If KR has only a title
        if (typeof kr === 'string') {
          changed = true;
          return { title: kr, type: 'percent', progress: 0 };
        }
        // If KR has progress (old model)
        if (kr.progress && typeof kr.progress === 'number') {
          changed = true;
          return { ...kr, type: 'percent', progress: kr.progress };
        }
        // If KR has current/target
        if (kr.current !== undefined && kr.target !== undefined) {
          changed = true;
          return { ...kr, type: 'target', current: kr.current, target: kr.target, unit: kr.unit || '' };
        }
        // Default fallback
        changed = true;
        return { ...kr, type: 'percent', progress: 0 };
      });
      if (changed) {
        await okrs.updateOne({ _id: okr._id }, { $set: { keyResults: newKRs } });
        updatedCount++;
      }
    }
    console.log(`Migrated ${updatedCount} OKRs to new key result model.`);
  } finally {
    await client.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
