/* GET /.netlify/functions/inquiries
 * Returns all inquiries from MongoDB, newest first. Requires an authenticated session.
 */
const { MongoClient } = require('mongodb');
const { json, getSession } = require('../lib/auth');

let clientPromise = null;
function getClient() {
  if (!clientPromise) {
    clientPromise = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
    }).connect();
  }
  return clientPromise;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return json(405, { ok: false, detail: 'Method not allowed.' });
  }
  if (!getSession(event)) {
    return json(401, { ok: false, detail: 'Authentication required.' });
  }
  if (!process.env.MONGODB_URI) {
    return json(500, { ok: false, detail: 'Server misconfigured: MONGODB_URI missing.' });
  }

  try {
    const client = await getClient();
    const db     = client.db(process.env.MONGODB_DB || 'nexbms');
    const docs   = await db.collection('inquiries')
      .find({})
      .sort({ created_at: -1 })
      .limit(500)
      .toArray();

    const items = docs.map(d => ({
      id:         d._id.toString(),
      full_name:  d.full_name || '',
      email:      d.email     || '',
      phone:      d.phone     || '',
      subject:    d.subject   || '',
      message:    d.message   || '',
      created_at: d.created_at instanceof Date ? d.created_at.toISOString() : null,
    }));
    return json(200, { ok: true, items });
  } catch (e) {
    console.error('[inquiries] fetch failed:', e && e.message);
    return json(500, { ok: false, detail: 'Could not load inquiries.' });
  }
};
