/* POST /.netlify/functions/login  body: { user, pass }  -> sets session cookie
 * GET  /.netlify/functions/login                        -> { ok, authenticated }
 * Credentials compared against ADMIN_USER / ADMIN_PASSWORD env vars.
 */
const {
  json,
  sign,
  getSession,
  setCookieHeader,
  stripQuotesWhitespace,
  safeEqual,
} = require('../lib/auth');

exports.handler = async (event) => {
  const method = event.httpMethod;

  if (method === 'GET') {
    const sess = getSession(event);
    return json(200, { ok: true, authenticated: !!sess });
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

  const user = stripQuotesWhitespace(data.user);
  const pass = stripQuotesWhitespace(data.pass);

  const expectedUser = stripQuotesWhitespace(process.env.ADMIN_USER || '');
  const expectedPass = stripQuotesWhitespace(process.env.ADMIN_PASSWORD || '');

  if (!expectedUser || !expectedPass) {
    return json(500, { ok: false, detail: 'Admin credentials not configured.' });
  }

  if (!safeEqual(expectedUser, user) || !safeEqual(expectedPass, pass)) {
    return json(401, { ok: false, detail: 'Invalid credentials.' });
  }

  return json(
    200,
    { ok: true, authenticated: true },
    { 'Set-Cookie': setCookieHeader(sign(user)) }
  );
};
