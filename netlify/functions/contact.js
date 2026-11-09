/* POST /.netlify/functions/contact
 * Inserts a contact form submission into the MongoDB "inquiries" collection.
 * Body: { full_name, email, phone, subject, message }
 */
const { MongoClient } = require('mongodb');
const { json } = require('../lib/auth');

let clientPromise = null;
function getClient() {
  if (!clientPromise) {
    clientPromise = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
    }).connect().catch(error => {
      clientPromise = null;
      throw error;
    });
  }
  return clientPromise;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};
const respond = (status, body) => json(status, body, corsHeaders);

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    };
  }
  if (event.httpMethod !== 'POST') {
    return respond(405, { ok: false, detail: 'Method not allowed.' });
  }

  let data;
  try { data = JSON.parse(event.body || ''); }
  catch { return respond(400, { ok: false, detail: 'Invalid JSON payload.' }); }
  if (!data || typeof data !== 'object') {
    return respond(400, { ok: false, detail: 'Invalid JSON payload.' });
  }

  const trim = v => (typeof v === 'string' ? v.trim() : '');
  const fullName = trim(data.full_name || data.name);
  const email    = trim(data.email);
  const phone    = trim(data.phone);
  const subject  = trim(data.subject);
  const message  = trim(data.message);

  const errors = [];
  if (!fullName) errors.push('full_name is required.');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('A valid email is required.');
  if (!phone || (phone.match(/\d/g) || []).length < 6)     errors.push('A valid phone is required.');
  if (!message || message.length < 10)                     errors.push('A message of at least 10 characters is required.');
  if (errors.length) return respond(400, { ok: false, detail: errors.join(' ') });

  if (!process.env.MONGODB_URI) {
    return respond(500, { ok: false, detail: 'Server misconfigured: MONGODB_URI missing.' });
  }

  try {
    const client = await getClient();
    const db     = client.db('nexbms');
    const result = await db.collection('inquiries').insertOne({
      full_name:  fullName,
      email,
      phone,
      subject:    subject || 'General Inquiry',
      message,
      created_at: new Date(),
    });
    return respond(200, {
      ok: true,
      id: result.insertedId.toString(),
    });
  } catch (e) {
    console.error('[contact] insert failed:', e && e.message);
    return respond(500, { ok: false, detail: 'Could not save your message. Please try again shortly.' });
  }
};
