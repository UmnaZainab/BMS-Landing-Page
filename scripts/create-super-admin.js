// One-time CLI setup. Supply SETUP_MONGODB_URI for the intended database.
const crypto = require('crypto');
const { MongoClient } = require('mongodb');
const { hashPassword, normalizeUsername, validUsername } = require('../netlify/lib/users');

async function main() {
  const args = process.argv.slice(2);
  const username = normalizeUsername(args[args.indexOf('--username') + 1]);
  const dbName = args.includes('--db') ? args[args.indexOf('--db') + 1] : 'nexum_bms';
  const uri = process.env.SETUP_MONGODB_URI;
  if (!validUsername(username) || !/^[a-zA-Z0-9_-]+$/.test(dbName || '') || !uri) {
    throw new Error('Set SETUP_MONGODB_URI and pass --username NAME [--db DATABASE].');
  }
  const parsed = new URL(uri);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  if (!local && !args.includes('--allow-remote')) {
    throw new Error('Remote MongoDB target blocked. Use --allow-remote only for an intentional one-time remote setup.');
  }
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  try {
    await client.connect();
    const users = client.db(dbName).collection('admin_users');
    await users.createIndex({ username: 1 }, { unique: true });
    await users.createIndex({ role: 1 }, {
      unique: true,
      partialFilterExpression: { role: 'super_admin' },
    });
    const existing = await users.findOne({ role: 'super_admin' });
    if (existing) throw new Error('A Super Admin already exists; setup has already been completed.');
    let password = crypto.randomBytes(24).toString('base64url');
    if (args.includes('--password-stdin')) {
      let input = '';
      for await (const chunk of process.stdin) input += chunk;
      password = input.replace(/\r?\n$/, '');
      if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
        throw new Error('Initial password must be 12 to 72 bytes.');
      }
    }
    await users.insertOne({
      username,
      role: 'super_admin',
      status: 'active',
      password_hash: hashPassword(password),
      session_version: crypto.randomUUID(),
      created_at: new Date(),
    });
    process.stdout.write(`Super Admin ${username} created in ${dbName}.` +
      (args.includes('--password-stdin') ? '\n' : ` Initial password: ${password}\n`));
  } finally {
    await client.close();
  }
}

main().catch(error => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
