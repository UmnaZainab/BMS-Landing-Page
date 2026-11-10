const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { getSession, safeEqual } = require('./auth');
const USERNAME_PATTERN = /^[a-z0-9_.-]{3,64}$/;

function normalizeUsername(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function validUsername(value) {
  return USERNAME_PATTERN.test(normalizeUsername(value));
}

function validPassword(value) {
  return typeof value === 'string' && value.length >= 12 && Buffer.byteLength(value, 'utf8') <= 72;
}

function hashPassword(password) {
  return bcrypt.hashSync(password, 12);
}

function verifyPassword(password, stored) {
  return typeof password === 'string' && typeof stored === 'string' &&
    /^\$2[aby]\$/.test(stored) && bcrypt.compareSync(password, stored);
}

async function getAuthenticatedUser(event, db) {
  const session = getSession(event);
  if (!session) return null;
  const user = await db.collection('admin_users').findOne({ username: session.user });
  if (!user || typeof user.session_version !== 'string' ||
      !safeEqual(user.session_version, session.version) || user.status !== 'active' ||
      !['admin', 'super_admin'].includes(user.role)) return null;
  return user;
}

module.exports = {
  normalizeUsername,
  validUsername,
  validPassword,
  hashPassword,
  verifyPassword,
  getAuthenticatedUser,
};
