const { MongoClient } = require('mongodb');

let clientPromise;

async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not configured');
  if (!clientPromise) {
    clientPromise = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 })
      .connect().catch(error => {
        clientPromise = null;
        throw error;
      });
  }
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB || 'nexum_bms');
}

module.exports = { getDb };
