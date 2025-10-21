import { MongoClient, Db } from "mongodb";
let client: MongoClient | null = null;
let promise: Promise<MongoClient> | null = null;

export async function getClient() {
  if (client) return client;
  if (!promise) {
    const uri = process.env.MONGODB_URI!;
    promise = new MongoClient(uri, { maxPoolSize: 10 }).connect();
  }
  client = await promise;
  return client;
}

export async function getDb(dbName: string): Promise<Db> {
  const c = await getClient();
  return c.db(dbName);
}
