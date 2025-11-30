// src/lib/db/loggedinuser/connectDB.ts
import { MongoClient, Db, Collection, type Document } from "mongodb";

// You can keep just MONGODB_URI + MONGODB_DB,
// or add special ones for this feature.
const MONGODB_URI =
  process.env.MONGODB_URI_LOGGEDIN || process.env.MONGODB_URI;
const MONGODB_DB =
  process.env.MONGODB_DB_LOGGEDIN || process.env.MONGODB_DB || "admit55";

// Name of the collection where we'll store "people who logged in"
const LOGGED_IN_USERS_COLLECTION = "logged_in_users";

// Small TS helper for global caching
type MongoGlobal = typeof globalThis & {
  _loggedInUserClient?: MongoClient;
  _loggedInUserDb?: Db;
};

const mongoGlobal = global as MongoGlobal;

if (!MONGODB_URI) {
  throw new Error(
    "[loggedinuser/connectDB] MONGODB_URI (or MONGODB_URI_LOGGEDIN) is not set"
  );
}

/**
 * Connect to MongoDB (using official driver) and
 * reuse the same client/DB across hot reloads in dev.
 */
export async function connectDB(): Promise<Db> {
  // If we already have a cached DB, return it
  if (mongoGlobal._loggedInUserDb) {
    return mongoGlobal._loggedInUserDb;
  }

  // Create client once and cache it
  if (!mongoGlobal._loggedInUserClient) {
    // MONGODB_URI is checked above, so cast is safe
    mongoGlobal._loggedInUserClient = new MongoClient(MONGODB_URI as string);
  }

  const client = mongoGlobal._loggedInUserClient;

  // In modern MongoDB driver, connect() is idempotent,
  // so we can just call it without checking client.topology
  await client.connect();

  const db = client.db(MONGODB_DB);
  mongoGlobal._loggedInUserDb = db;

  return db;
}

/**
 * Convenience helper: get the "logged_in_users" collection.
 * We'll use this from our User model / auth callbacks.
 */
export async function getLoggedInUsersCollection<
  T extends Document = Document
>(): Promise<Collection<T>> {
  const db = await connectDB();
  return db.collection<T>(LOGGED_IN_USERS_COLLECTION);
}
