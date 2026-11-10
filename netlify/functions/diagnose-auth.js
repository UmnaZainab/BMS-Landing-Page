// Temporary, read-only deployment diagnostic; remove after use.
const crypto = require('crypto');
const { getDb } = require('../lib/db');
const { json } = require('../lib/auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { ok: false });
  const uri = process.env.MONGODB_URI || '';
  const expected = crypto.createHmac('sha256', uri).update('NEXBMS-AUTH-DIAGNOSTIC-V1').digest('hex');
  const supplied = event.headers?.['x-diagnostic-proof'] || '';
  if (!uri || supplied.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
    return json(403, { ok: false });
  }
  let username;
  try { username = JSON.parse(event.body || '{}').username; } catch { return json(400, { ok: false }); }
  if (typeof username !== 'string' || !/^[a-z0-9_.-]{3,64}$/.test(username)) {
    return json(400, { ok: false });
  }
  try {
    const db = await getDb();
    const user = await db.collection('admin_users').findOne({ username }, {
      projection: { username: 1, role: 1, status: 1, password_hash: 1 },
    });
    return json(200, {
      ok: true,
      database: db.databaseName,
      userFound: !!user,
      role: user?.role || null,
      status: user?.status || null,
      bcryptHash: typeof user?.password_hash === 'string' && user.password_hash.startsWith('$2'),
    });
  } catch (error) {
    return json(500, { ok: false, detail: error.message });
  }
};
