import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { beforeAll, afterAll, afterEach } from 'vitest';

let mongoServer: MongoMemoryServer;

// Set a dummy JWT_SECRET for tests to satisfy the auth middleware's strict requirement
process.env.JWT_SECRET = 'test-secret-key';
process.env.MONGOMS_VERSION = '7.0.14';

beforeAll(async () => {
  if (process.env.SKIP_MONGO === 'true') return;
  const testUri = process.env.TEST_MONGODB_URI || process.env.MONGODB_URI;
  if (testUri && !testUri.includes('user:pass')) {
    try {
      await mongoose.connect(testUri);
      return;
    } catch (err: any) {
      console.warn('Failed connecting to TEST_MONGODB_URI, falling back to MongoMemoryServer:', err.message);
    }
  }

  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  } catch (err: any) {
    console.warn('MongoMemoryServer initialization skipped/failed:', err.message);
  }
}, 180000);

afterAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (err) {
    // Teardown safely
  }
});

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});
