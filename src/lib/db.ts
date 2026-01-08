import mongoose from "mongoose";

type MongooseConnection = typeof mongoose;

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: {
    conn: MongooseConnection | null;
    promise: Promise<MongooseConnection> | null;
  } | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

async function connectDB(): Promise<MongooseConnection> {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
      throw new Error("Please define MONGODB_URI in .env.local");
    }

    cached!.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    }).then((mongoose) => {
      console.log("✅ MongoDB connected");
      return mongoose;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

export default connectDB;

