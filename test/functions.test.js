const assert = require('node:assert/strict');
const { test } = require('node:test');
const Module = require('node:module');

let inserted;
let query;
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'mongodb') {
    return {
      MongoClient: class {
        async connect() { return this; }
        db(name) {
          assert.equal(name, 'nexbms');
          return {
            collection(collectionName) {
              assert.equal(collectionName, 'inquiries');
              return {
                async insertOne(doc) {
                  inserted = doc;
                  return { insertedId: { toString: () => 'test-id' } };
                },
                find(filter) {
                  assert.deepEqual(filter, {});
                  return {
                    sort(sort) {
                      query = { sort };
                      return this;
                    },
                    limit(limit) {
                      query.limit = limit;
                      return this;
                    },
                    async toArray() { return []; },
                  };
                },
              };
            },
          };
        }
      },
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const contact = require('../netlify/functions/contact').handler;
const login = require('../netlify/functions/login').handler;
const inquiries = require('../netlify/functions/inquiries').handler;
Module._load = originalLoad;

test('contact validates JSON, returns CORS headers, and stores a name alias with UTC time', async () => {
  process.env.MONGODB_URI = 'mongodb://mock';
  const invalid = await contact({ httpMethod: 'POST', body: '{' });
  assert.equal(invalid.statusCode, 400);
  assert.equal(invalid.headers['Access-Control-Allow-Origin'], '*');

  const response = await contact({
    httpMethod: 'POST',
    body: JSON.stringify({ name: 'Ada', email: 'ada@example.com', phone: '123456', message: 'A useful message' }),
  });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), { ok: true, id: 'test-id' });
  assert.equal(inserted.full_name, 'Ada');
  assert.ok(inserted.created_at instanceof Date);
});

test('admin cookie permits inquiries and is rejected after credentials are removed', async () => {
  process.env.ADMIN_USER = ' "admin" ';
  process.env.ADMIN_PASSWORD = ' "secret" ';
  process.env.MONGODB_URI = 'mongodb://mock';
  const denied = await inquiries({ httpMethod: 'GET', headers: {} });
  assert.equal(denied.statusCode, 401);

  const signedIn = await login({ httpMethod: 'POST', body: JSON.stringify({ user: 'admin', pass: 'secret' }) });
  assert.equal(signedIn.statusCode, 200);
  const cookie = signedIn.headers['Set-Cookie'];
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);

  const event = { httpMethod: 'GET', headers: { cookie } };
  assert.equal(JSON.parse((await login(event)).body).authenticated, true);
  const response = await inquiries(event);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), { ok: true, items: [] });
  assert.deepEqual(query, { sort: { created_at: -1 }, limit: 500 });

  delete process.env.ADMIN_PASSWORD;
  assert.equal((await inquiries(event)).statusCode, 401);
});
