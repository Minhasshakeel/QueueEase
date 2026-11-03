const { db, today, send } = require('../lib/db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  try {
    const b = req.body || {};
    const name = String(b.name || '').trim().slice(0, 80);
    const phone = String(b.phone || '').trim();
    const clinicId = Number(b.clinic_id);
    if (name.length < 2 || !/^03\d{9}$/.test(phone) || !Number.isInteger(clinicId)) {
      return send(res, 400, { error: 'Invalid details' });
    }
    const clinic = await db(`clinics?id=eq.${clinicId}&status=eq.active&select=id`);
    if (!clinic.length) return send(res, 404, { error: 'Clinic not available' });

    const d = today();
    // Same phone already waiting at this clinic today: return the same token.
    const existing = await db(`tokens?clinic_id=eq.${clinicId}&queue_date=eq.${d}&phone=eq.${phone}&status=eq.waiting&select=token_number&limit=1`);
    if (existing.length) {
      const t = existing[0].token_number;
      return send(res, 200, { token: t, message: `Aapka token number ${t} hai` });
    }

    for (let i = 0; i < 4; i++) {
      const last = await db(`tokens?clinic_id=eq.${clinicId}&queue_date=eq.${d}&select=token_number&order=token_number.desc&limit=1`);
      const next = (last[0] ? last[0].token_number : 0) + 1;
      try {
        await db('tokens', { method: 'POST', body: JSON.stringify({ token_number: next, patient_name: name, phone, clinic_id: clinicId, queue_date: d }) });
        return send(res, 200, { token: next, message: `Aapka token number ${next} hai` });
      } catch (e) {
        if (e.code !== '23505') throw e; // number taken by someone else, try again
      }
    }
    return send(res, 409, { error: 'Busy, please try again' });
  } catch (e) {
    return send(res, 500, { error: 'Server error' });
  }
};
