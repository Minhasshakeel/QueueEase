// Small helper for talking to Supabase from the API functions.
const BASE_URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SECRET_KEY;

async function db(path, options = {}) {
  if (!BASE_URL || !KEY) throw new Error('Server is not configured');
  const r = await fetch(`${BASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { apikey: KEY, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(options.headers || {}) }
  });
  const text = await r.text();
  if (!r.ok) {
    const e = new Error('Database error');
    try { e.code = JSON.parse(text).code; } catch (_) {}
    throw e;
  }
  return text ? JSON.parse(text) : null;
}

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
const send = (res, status, body) => res.status(status).json(body);

module.exports = { db, today, send };
