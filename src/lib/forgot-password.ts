import { getCollection } from "./mongodb-utils";
import { ObjectId } from "mongodb";

export async function savePasswordResetToken(userId: ObjectId, token: string, expires: string) {
  const tokens = await getCollection("password_reset_tokens");
  await tokens.insertOne({ userId, token, expires, used: false });
}

export async function findUserIdByResetToken(token: string) {
  const tokens = await getCollection("password_reset_tokens");
  const doc = await tokens.findOne({ token, used: false, expires: { $gt: new Date().toISOString() } });
  if (!doc) return null;
  return doc.userId;
}

export async function markTokenUsed(token: string) {
  const tokens = await getCollection("password_reset_tokens");
  await tokens.updateOne({ token }, { $set: { used: true } });
}
