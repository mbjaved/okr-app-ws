// Script: fix-unarchived-okrs.ts
// Removes departmentId if it's an empty string for all active OKRs
// Run with: npx ts-node scripts/fix-unarchived-okrs.ts

import { getCollection } from "../src/lib/mongodb-utils";

async function main() {
  const okrs = await getCollection("okrs");
  const result = await okrs.updateMany(
    { status: "active", departmentId: "" },
    { $unset: { departmentId: "" } }
  );
  console.log(`Fixed ${result.modifiedCount} OKRs.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
