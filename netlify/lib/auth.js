/* Shared signed-cookie and response helpers for Netlify Functions. */
const crypto = require('crypto');

const COOKIE_NAME = 'NEXBMS_ADMIN';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 hours

function hmacSecret() {
  const secret = stripQuotesWhitespace(process.env.ADMIN_SESSION_SECRET) ||
    stripQuotesWhitespace(process.env.MONGODB_URI);
  if (!secret) return null;
  return crypto.createHash('sha256').update(secret + '|NEXBMS-SESSION-V2').digest();
}

function sign(user, version) {
  const key = hmacSecret();
  if (!key) throw new Error('Session signing secret is not configured');
  const exp = Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE_SECONDS;
  const payload = Buffer.from(JSON.stringify({ user, version, exp })).toString('base64url');
  const hmac = crypto.createHmac('sha256', key).update(payload).digest('base64url');
  return `${payload}.${hmac}`;
}

function verify(token) {
  const key = hmacSecret();
  if (!key || typeof token !== 'string' || token.length > 2048) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const expected = crypto.createHmac('sha256', key).update(parts[0]).digest('base64url');
  if (!safeEqual(expected, parts[1])) return null;
  try {
    const session = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    if (typeof session.user !== 'string' || typeof session.version !== 'string' ||
        !Number.isSafeInteger(session.exp) || session.exp <= Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch { return null; }
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(/;\s*/).forEach(pair => {
    const i = pair.indexOf('=');
    if (i < 0) return;
    const name  = pair.slice(0, i).trim();
    const value = pair.slice(i + 1).trim();
    try { out[name] = decodeURIComponent(value); } catch { out[name] = value; }
  });
  return out;
}

function setCookieHeader(token) {
  return [
    `${COOKIE_NAME}=${token}`,
    `Max-Age=${COOKIE_MAX_AGE_SECONDS}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Secure',
  ].join('; ');
}

function clearCookieHeader() {
  return `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax; Secure`;
}

function json(statusCode, body, extraHeaders) {
  return {
    statusCode,
    headers: Object.assign(
      {
        'Content-Type':         'application/json; charset=utf-8',
        'Cache-Control':        'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
      extraHeaders || {}
    ),
    body: JSON.stringify(body),
  };
}

function getSession(event) {
  const headers = event.headers || {};
  const cookieHeader = headers.cookie || headers.Cookie || '';
  const cookies = parseCookies(cookieHeader);
  return verify(cookies[COOKIE_NAME]);
}

function stripQuotesWhitespace(v) {
  return typeof v === 'string' ? v.replace(/^["'\s]+|["'\s]+$/g, '') : '';
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a), 'utf8');
  const bb = Buffer.from(String(b), 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

module.exports = {
  COOKIE_NAME,
  sign,
  verify,
  parseCookies,
  setCookieHeader,
  clearCookieHeader,
  json,
  getSession,
  stripQuotesWhitespace,
  safeEqual,
};
