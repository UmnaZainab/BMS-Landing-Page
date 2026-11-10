const assert = require('node:assert/strict');
const { test } = require('node:test');
const Module = require('node:module');
const crypto = require('node:crypto');

const users = [];
const inquiriesData = [];
let query;
let databaseName;

function matches(doc, filter) {
  return Object.entries(filter).every(([key, value]) => doc[key] === value);
}

const collections = {
  admin_users: {
    async findOne(filter) { return users.find(user => matches(user, filter)) || null; },
    async createIndex(keys, options) {
      assert.deepEqual(keys, { username: 1 });
      assert.equal(options.unique, true);
    },
    async insertOne(doc) {
      if (users.some(user => user.username === doc.username)) {
        throw Object.assign(new Error('duplicate'), { code: 11000 });
      }
      const record = { _id: String(users.length + 1), ...doc };
      users.push(record);
      return { insertedId: record._id };
    },
    async updateOne(filter, update, options) {
      const existing = users.find(user => matches(user, filter));
      if (existing) {
        if (update.$set) Object.assign(existing, update.$set);
        return { matchedCount: 1 };
      }
      if (options?.upsert) {
        await this.insertOne({ ...filter, ...update.$setOnInsert });
        return { matchedCount: 0, upsertedCount: 1 };
      }
      return { matchedCount: 0 };
    },
  },
  inquiries: {
    async insertOne(doc) {
      inquiriesData.push({ _id: { toString: () => 'test-id' }, ...doc });
      return { insertedId: { toString: () => 'test-id' } };
    },
    find(filter) {
      assert.deepEqual(filter, {});
      return {
        sort(sort) { query = { sort }; return this; },
        limit(limit) { query.limit = limit; return this; },
        async toArray() { return inquiriesData.slice(); },
      };
    },
  },
};

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'mongodb') {
    return {
      MongoClient: class {
        async connect() { return this; }
        db(name) {
          databaseName = name;
          return { collection: name => collections[name] };
        }
      },
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};
const contact = require('../netlify/functions/contact').handler;
const login = require('../netlify/functions/login').handler;
const inquiries = require('../netlify/functions/inquiries').handler;
const manage = require('../netlify/functions/user-management').handler;
const { verifyPassword, hashPassword } = require('../netlify/lib/users');
Module._load = originalLoad;

function post(handler, body, cookie) {
  return handler({ httpMethod: 'POST', body: JSON.stringify(body), headers: cookie ? { cookie } : {} });
}

test('contact uses the configured database and writes UTC dates', async () => {
  process.env.MONGODB_URI = 'mongodb://mock';
  process.env.MONGODB_DB = 'custom_db';
  const invalid = await contact({ httpMethod: 'POST', body: '{' });
  assert.equal(invalid.statusCode, 400);
  assert.equal(invalid.headers['Access-Control-Allow-Origin'], '*');
  const response = await post(contact, {
    name: 'Ada', email: 'ada@example.com', phone: '123456', message: 'A useful message',
  });
  assert.equal(response.statusCode, 200);
  assert.equal(databaseName, 'custom_db');
  assert.equal(inquiriesData[0].full_name, 'Ada');
  assert.ok(inquiriesData[0].created_at instanceof Date);
});

const adminName = `test${crypto.randomBytes(4).toString('hex')}`;
const adminPass = crypto.randomBytes(18).toString('base64url');

test('login checks the existing admin_users record and rejects bad credentials', async () => {
  delete process.env.MONGODB_DB;
  users.push({ _id: '1', username: adminName, password_hash: hashPassword(adminPass),
    session_version: crypto.randomUUID(), role: 'super_admin', status: 'active' });
  const bad = await post(login, { user: adminName, pass: 'wrong' });
  assert.equal(bad.statusCode, 401);
  assert.equal(users.length, 1);
  assert.equal(users[0].username, adminName);
  assert.equal(verifyPassword(adminPass, users[0].password_hash), true);

  const good = await post(login, { user: adminName.toUpperCase(), pass: adminPass });
  assert.equal(good.statusCode, 200);
  assert.equal(databaseName, 'nexum_bms');
  assert.match(good.headers['Set-Cookie'], /HttpOnly.*Secure/);
});

test('add user and change password invalidate the previous session', async () => {
  process.env.MONGODB_URI = 'mongodb://mock';
  const adminLogin = await post(login, { user: adminName, pass: adminPass });
  const adminCookie = adminLogin.headers['Set-Cookie'];
  const noAuth = await post(manage, { action: 'add-user', username: 'alice', password: 'a-long-password' });
  assert.equal(noAuth.statusCode, 401);

  const added = await post(manage, { action: 'add-user', username: 'Alice', password: 'a-long-password' }, adminCookie);
  assert.equal(added.statusCode, 200);
  assert.equal(users.length, 2);
  assert.equal(users[1].username, 'alice');
  assert.equal(verifyPassword('a-long-password', users[1].password_hash), true);
  assert.equal((await post(manage, { action: 'add-user', username: 'ALICE', password: 'a-long-password' }, adminCookie)).statusCode, 409);

  const aliceLogin = await post(login, { user: 'alice', pass: 'a-long-password' });
  assert.equal(aliceLogin.statusCode, 200);
  const oldCookie = aliceLogin.headers['Set-Cookie'];
  const wrongCurrent = await post(manage, {
    action: 'change-password', current_password: 'wrong', new_password: 'new-long-password',
  }, oldCookie);
  assert.equal(wrongCurrent.statusCode, 403);

  const changed = await post(manage, {
    action: 'change-password', current_password: 'a-long-password', new_password: 'new-long-password',
  }, oldCookie);
  assert.equal(changed.statusCode, 200);
  const newCookie = changed.headers['Set-Cookie'];
  assert.equal((await inquiries({ httpMethod: 'GET', headers: { cookie: oldCookie } })).statusCode, 401);
  assert.equal((await inquiries({ httpMethod: 'GET', headers: { cookie: newCookie } })).statusCode, 200);
  assert.deepEqual(query, { sort: { created_at: -1 }, limit: 500 });
  assert.equal((await post(login, { user: 'alice', pass: 'a-long-password' })).statusCode, 401);
  assert.equal((await post(login, { user: 'alice', pass: 'new-long-password' })).statusCode, 200);
});
