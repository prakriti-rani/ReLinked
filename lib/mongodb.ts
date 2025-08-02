import mongoose from 'mongoose';

// More robust build-time detection
const IS_BUILD_TIME = (() => {
  try {
    // During Vercel build, these conditions indicate build time
    return process.env.NEXT_PHASE === 'phase-production-build' ||
           process.env.VERCEL_ENV === undefined && process.env.NODE_ENV === 'production' ||
           typeof window === 'undefined' && !process.env.MONGODB_URI && process.env.NODE_ENV === 'production';
  } catch {
    // If process is not available, assume runtime
    return false;
  }
})();

interface GlobalWithMongoose {
  mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

declare const global: GlobalWithMongoose;

let cached = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  // Skip connection during build time
  if (IS_BUILD_TIME) {
    console.warn('MongoDB connection skipped during build');
    return null;
  }
  
  // Get MONGODB_URI at runtime only
  const MONGODB_URI = process.env.MONGODB_URI;
  
  // Check for MONGODB_URI at runtime
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 10000, // Increased timeout to 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      connectTimeoutMS: 10000, // Increased connection timeout
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
      w: 'majority' as const
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('Connected to MongoDB successfully');
      return mongoose;
    }).catch((error) => {
      console.error('MongoDB connection failed during connect:', error);
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('MongoDB connection error:', e);
    if (e instanceof Error) {
      console.error('Error message:', e.message);
      console.error('Error name:', e.name);
    }
    throw new Error(`Database connection failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  return cached.conn;
}

export default connectDB;
