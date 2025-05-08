// Script: fix-unarchived-okrs.js
// Removes departmentId if it's an empty string for all active OKRs
// Run with: node scripts/fix-unarchived-okrs.js

const { getCollection } = require("../src/lib/mongodb-utils");

(async function main() {
  try {
    const okrs = await getCollection("okrs");
    const result = await okrs.updateMany(
      { status: "active", departmentId: "" },
      { $unset: { departmentId: "" } }
    );
    console.log(`Fixed ${result.modifiedCount} OKRs.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
