/* /.netlify/functions/pricing
 *   GET  (public)         -> { ok, items: [{ id, cardName, currentAmount, defaultAmount }] }
 *   POST (authenticated)  -> { ok, item }   body: { id, amount }
 *   PUT  (authenticated)  -> same as POST
 *
 * Reads/writes MongoDB collection "pricing_items" where each doc is
 *   { _id: <id>, amount: <number>, updated_at: <Date>, updated_by: <username> }.
 * The DEFAULTS below mirror the module cards rendered by pricing.js so the public
 * endpoint keeps serving sensible numbers even when no override is stored yet.
 */
const { json, getSession } = require('../lib/auth');
const { getDb } = require('../lib/db');
const { getAuthenticatedUser } = require('../lib/users');

const DEFAULTS = [
  { id: 'employee-management', cardName: 'Employee Management', defaultAmount: 5000 },
  { id: 'hr-management',       cardName: 'HR Management',       defaultAmount: 15000 },
  { id: 'attendance-leave',    cardName: 'Attendance & Leave',  defaultAmount: 8000 },
  { id: 'finance-payroll',     cardName: 'Finance & Payroll',   defaultAmount: 10000 },
  { id: 'projects-tasks',      cardName: 'Projects & Tasks',    defaultAmount: 12000 },
];

const DEFAULT_MAP = DEFAULTS.reduce((m, d) => (m[d.id] = d, m), {});
const MIN_AMOUNT = 0;
const MAX_AMOUNT = 100000000;

function listItems(docs) {
  const overrides = {};
  (docs || []).forEach(d => { if (d && typeof d._id === 'string') overrides[d._id] = d; });
  return DEFAULTS.map(d => {
    const override = overrides[d.id];
    const amount = override && Number.isFinite(override.amount) ? override.amount : d.defaultAmount;
    return {
      id:            d.id,
      cardName:      d.cardName,
      currentAmount: amount,
      defaultAmount: d.defaultAmount,
    };
  });
}

function parseAmount(raw) {
  if (typeof raw === 'number') return raw;
  if (typeof raw !== 'string') return NaN;
  const cleaned = raw.replace(/[,\s]/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return NaN;
  return Number(cleaned);
}

exports.handler = async (event) => {
  const method = event.httpMethod;

  if (!process.env.MONGODB_URI) {
    return json(500, { ok: false, detail: 'Server misconfigured: MONGODB_URI missing.' });
  }

  if (method === 'GET') {
    try {
      const db = await getDb();
      const docs = await db.collection('pricing_items').find({}).toArray();
      return json(200, { ok: true, items: listItems(docs) });
    } catch (error) {
      console.error('[pricing] fetch failed:', error && error.message);
      return json(500, { ok: false, detail: 'Could not load pricing.' });
    }
  }

  if (method !== 'POST' && method !== 'PUT') {
    return json(405, { ok: false, detail: 'Method not allowed.' });
  }

  if (!getSession(event)) {
    return json(401, { ok: false, detail: 'Authentication required.' });
  }

  let data;
  try { data = JSON.parse(event.body || ''); }
  catch { return json(400, { ok: false, detail: 'Invalid JSON payload.' }); }
  if (!data || typeof data !== 'object') {
    return json(400, { ok: false, detail: 'Invalid JSON payload.' });
  }

  const id = typeof data.id === 'string' ? data.id.trim() : '';
  if (!DEFAULT_MAP[id]) {
    return json(400, { ok: false, detail: 'Unknown pricing card id.' });
  }
  const amount = parseAmount(data.amount);
  if (!Number.isFinite(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
    return json(400, { ok: false, detail: 'Amount must be a non-negative number.' });
  }

  try {
    const db = await getDb();
    const user = await getAuthenticatedUser(event, db);
    if (!user) return json(401, { ok: false, detail: 'Authentication required.' });

    const now = new Date();
    await db.collection('pricing_items').updateOne(
      { _id: id },
      { $set: { amount, updated_at: now, updated_by: user.username } },
      { upsert: true }
    );
    const def = DEFAULT_MAP[id];
    return json(200, {
      ok: true,
      item: {
        id,
        cardName:      def.cardName,
        currentAmount: amount,
        defaultAmount: def.defaultAmount,
      },
    });
  } catch (error) {
    console.error('[pricing] update failed:', error && error.message);
    return json(500, { ok: false, detail: 'Could not update pricing.' });
  }
};
