const crypto = require('crypto');
const { db, today, send } = require('../lib/db');

function same(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  try {
    const b = req.body || {};
    const clinicId = Number(b.clinic_id);
    const pin = String(b.pin || '');
    if (!Number.isInteger(clinicId) || !pin) return send(res, 401, { ok: false, error: 'wrong_pin' });

    const clinic = await db(`clinics?id=eq.${clinicId}&select=staff_pin`);
    if (!clinic.length || !clinic[0].staff_pin || !same(pin, clinic[0].staff_pin)) {
      return send(res, 401, { ok: false, error: 'wrong_pin' });
    }

    const next = await db(`tokens?clinic_id=eq.${clinicId}&queue_date=eq.${today()}&status=eq.waiting&order=token_number.asc&limit=1&select=id,token_number,patient_name,phone`);
    if (!next.length) return send(res, 200, { found: false, message: 'Koi patient waiting mein nahi hai' });

    await db(`tokens?id=eq.${next[0].id}`, { method: 'PATCH', body: JSON.stringify({ status: 'called' }) });
    return send(res, 200, { found: true, token_number: next[0].token_number, patient_name: next[0].patient_name, phone: next[0].phone });
  } catch (e) {
    return send(res, 500, { error: 'Server error' });
  }
};
