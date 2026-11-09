const crypto = require('crypto');
const { json, getSession, sign, setCookieHeader } = require('../lib/auth');
const { getDb } = require('../lib/db');
const {
  getAuthenticatedUser,
  normalizeUsername,
  validUsername,
  validPassword,
  hashPassword,
  verifyPassword,
} = require('../lib/users');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, detail: 'Method not allowed.' });
  }
  if (!getSession(event)) {
    return json(401, { ok: false, detail: 'Authentication required.' });
  }

  let data;
  try { data = JSON.parse(event.body || ''); }
  catch { return json(400, { ok: false, detail: 'Invalid JSON payload.' }); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return json(400, { ok: false, detail: 'Invalid JSON payload.' });
  }
  if (data.action !== 'change-password' && data.action !== 'add-user') {
    return json(400, { ok: false, detail: 'Unknown action.' });
  }

  try {
    const db = await getDb();
    const currentUser = await getAuthenticatedUser(event, db);
    if (!currentUser) return json(401, { ok: false, detail: 'Authentication required.' });
    const users = db.collection('users');

    if (data.action === 'change-password') {
      if (!verifyPassword(data.current_password, currentUser.password_hash)) {
        return json(403, { ok: false, detail: 'Current password is incorrect.' });
      }
      if (!validPassword(data.new_password)) {
        return json(400, { ok: false, detail: 'New password must be 12 to 1024 characters.' });
      }
      if (data.current_password === data.new_password) {
        return json(400, { ok: false, detail: 'Choose a different password.' });
      }
      const version = crypto.randomUUID();
      const result = await users.updateOne({
        _id: currentUser._id,
        password_hash: currentUser.password_hash,
        session_version: currentUser.session_version,
      }, {
        $set: {
          password_hash: hashPassword(data.new_password),
          session_version: version,
          password_changed_at: new Date(),
        },
      });
      if (!result.matchedCount) {
        return json(409, { ok: false, detail: 'Account changed. Please sign in again.' });
      }
      return json(200, { ok: true, detail: 'Password changed.' }, {
        'Set-Cookie': setCookieHeader(sign(currentUser.username, version)),
      });
    }

    const username = normalizeUsername(data.username);
    if (!validUsername(username)) {
      return json(400, { ok: false, detail: 'Username must be 3 to 64 letters, numbers, dots, dashes, or underscores.' });
    }
    if (!validPassword(data.password)) {
      return json(400, { ok: false, detail: 'Password must be 12 to 1024 characters.' });
    }
    await users.createIndex({ username: 1 }, { unique: true });
    if (await users.findOne({ username })) {
      return json(409, { ok: false, detail: 'Username already exists.' });
    }
    await users.insertOne({
      username,
      password_hash: hashPassword(data.password),
      session_version: crypto.randomUUID(),
      created_at: new Date(),
      created_by: currentUser.username,
    });
    return json(200, { ok: true, detail: 'User added.' });
  } catch (error) {
    if (error && error.code === 11000) {
      return json(409, { ok: false, detail: 'Username already exists.' });
    }
    console.error('[user-management] request failed:', error);
    return json(500, { ok: false, detail: 'Could not update users. Please try again.' });
  }
};
