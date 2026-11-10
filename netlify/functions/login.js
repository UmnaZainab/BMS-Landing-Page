/* POST /.netlify/functions/login  body: { user, pass }  -> sets session cookie
 * GET  /.netlify/functions/login                        -> { ok, authenticated }
 * Credentials are checked against MongoDB admin_users.
 */
const {
  json,
  sign,
  getSession,
  setCookieHeader,
  stripQuotesWhitespace,
} = require('../lib/auth');
const { getDb } = require('../lib/db');
const {
  getAuthenticatedUser,
  normalizeUsername,
  verifyPassword,
} = require('../lib/users');

exports.handler = async (event) => {
  const method = event.httpMethod;

  if (method === 'GET') {
    if (!getSession(event)) return json(200, { ok: true, authenticated: false });
    try {
      const db = await getDb();
      return json(200, { ok: true, authenticated: !!await getAuthenticatedUser(event, db) });
    } catch (error) {
      console.error('[login] session check failed:', error);
      return json(500, { ok: false, detail: 'Could not check authentication.' });
    }
  }
  if (method !== 'POST') {
    return json(405, { ok: false, detail: 'Method not allowed.' });
  }

  let data;
  try { data = JSON.parse(event.body || ''); }
  catch { return json(400, { ok: false, detail: 'Invalid JSON payload.' }); }
  if (!data || typeof data !== 'object') {
    return json(400, { ok: false, detail: 'Invalid JSON payload.' });
  }

  const user = normalizeUsername(stripQuotesWhitespace(data.user));
  const pass = typeof data.pass === 'string' ? data.pass : '';
  if (!user || !pass) return json(401, { ok: false, detail: 'Invalid credentials.' });
  try {
    const db = await getDb();
    const record = await db.collection('admin_users').findOne({ username: user });
    if (!record || record.status !== 'active' ||
        !['admin', 'super_admin'].includes(record.role) || !verifyPassword(pass, record.password_hash)) {
      return json(401, { ok: false, detail: 'Invalid credentials.' });
    }
    return json(200, { ok: true, authenticated: true }, {
      'Set-Cookie': setCookieHeader(sign(record.username, record.session_version)),
    });
  } catch (error) {
    console.error('[login] authentication failed:', error);
    return json(500, { ok: false, detail: 'Could not sign in. Please try again.' });
  }
};
