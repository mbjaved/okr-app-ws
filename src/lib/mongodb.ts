import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI!;
// Extract database name from the URI if not explicitly set
const dbName = process.env.MONGODB_DB || new URL(uri).pathname.replace(/^\//, '') || 'okr-app';
console.log('🔌 Using database:', dbName);

const options = {
  // Add any additional connection options here
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MongoDB URI to .env.local");
}

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!(global as any)._mongoClientPromise) {
    client = new MongoClient(uri, options);
    (global as any)._mongoClientPromise = client.connect();
  }
  clientPromise = (global as any)._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

/**
 * Connect to the database and return the database instance
 */
export async function connectToDatabase() {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw new Error('Failed to connect to database');
  }
}

export { clientPromise };
export default clientPromise;
