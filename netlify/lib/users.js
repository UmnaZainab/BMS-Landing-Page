const crypto = require('crypto');
const { getSession, safeEqual, stripQuotesWhitespace } = require('./auth');

const ITERATIONS = 310000;
const USERNAME_PATTERN = /^[a-z0-9_.-]{3,64}$/;

function normalizeUsername(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function validUsername(value) {
  return USERNAME_PATTERN.test(normalizeUsername(value));
}

function validPassword(value) {
  return typeof value === 'string' && value.length >= 12 && value.length <= 1024;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256').toString('hex');
  return `pbkdf2_sha256$${ITERATIONS}$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  if (typeof password !== 'string' || typeof stored !== 'string') return false;
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2_sha256') return false;
  const iterations = Number(parts[1]);
  if (!Number.isSafeInteger(iterations) || iterations < 100000 || iterations > 1000000 ||
      !/^[0-9a-f]{32}$/.test(parts[2]) || !/^[0-9a-f]{64}$/.test(parts[3])) return false;
  const actual = crypto.pbkdf2Sync(password, parts[2], iterations, 32, 'sha256').toString('hex');
  return safeEqual(actual, parts[3]);
}

async function bootstrapAdmin(db) {
  const users = db.collection('users');
  const firstUser = await users.findOne({});
  if (firstUser) return;

  const username = normalizeUsername(stripQuotesWhitespace(process.env.ADMIN_USER));
  const password = stripQuotesWhitespace(process.env.ADMIN_PASSWORD);
  if (!validUsername(username) || !password) throw new Error('Initial admin credentials are not configured');

  await users.createIndex({ username: 1 }, { unique: true });
  await users.updateOne({ username }, {
    $setOnInsert: {
      username,
      password_hash: hashPassword(password),
      session_version: crypto.randomUUID(),
      created_at: new Date(),
    },
  }, { upsert: true });
}

async function getAuthenticatedUser(event, db) {
  const session = getSession(event);
  if (!session) return null;
  const user = await db.collection('users').findOne({ username: session.user });
  if (!user || typeof user.session_version !== 'string' ||
      !safeEqual(user.session_version, session.version)) return null;
  return user;
}

module.exports = {
  normalizeUsername,
  validUsername,
  validPassword,
  hashPassword,
  verifyPassword,
  bootstrapAdmin,
  getAuthenticatedUser,
};
