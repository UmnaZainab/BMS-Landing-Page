/* Shared auth + response helpers for Netlify Functions.
 *
 * Serverless functions cannot keep PHP-style sessions, so the admin flow uses
 * an HMAC-signed session cookie. Rotating ADMIN_PASSWORD invalidates all
 * existing cookies (intended).
 */
const crypto = require('crypto');

const COOKIE_NAME = 'NEXBMS_ADMIN';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 hours

function hmacSecret() {
  const pw = process.env.ADMIN_PASSWORD || '';
  return crypto.createHash('sha256').update(pw + '|NEXBMS-SESSION-V1').digest();
}

function sign(user) {
  const exp = Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE_SECONDS;
  const payload = `${exp}:${user}`;
  const hmac = crypto.createHmac('sha256', hmacSecret()).update(payload).digest('hex');
  return Buffer.from(`${payload}:${hmac}`, 'utf8').toString('base64url');
}

function verify(token) {
  if (!token || typeof token !== 'string') return null;
  let decoded;
  try { decoded = Buffer.from(token, 'base64url').toString('utf8'); } catch { return null; }
  const parts = decoded.split(':');
  if (parts.length !== 3) return null;
  const [exp, user, hmac] = parts;
  const expNum = parseInt(exp, 10);
  if (!Number.isFinite(expNum) || expNum < Math.floor(Date.now() / 1000)) return null;
  const expected = crypto.createHmac('sha256', hmacSecret()).update(`${exp}:${user}`).digest('hex');
  try {
    if (!crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expected, 'hex'))) return null;
  } catch { return null; }
  return { user, exp: expNum };
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
