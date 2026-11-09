/* POST /.netlify/functions/logout -> clears the session cookie */
const { json, clearCookieHeader } = require('../lib/auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, detail: 'Method not allowed.' });
  }
  return json(200, { ok: true }, { 'Set-Cookie': clearCookieHeader() });
};
