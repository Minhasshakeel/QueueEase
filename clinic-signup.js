const { db, send } = require('../lib/db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Method not allowed' });
  try {
    const b = req.body || {};
    const clinicName = String(b.clinic_name || '').trim().slice(0, 80);
    const ownerName = String(b.owner_name || '').trim().slice(0, 80);
    const ownerPhone = String(b.owner_phone || '').trim();
    const area = String(b.area || '').trim().slice(0, 60);
    const city = String(b.city || '').trim().slice(0, 60);
    const pin = String(b.pin || '').trim();
    const avg = Number(b.avg_minutes);

    let error = null;
    if (clinicName.length < 3) error = 'Clinic name is too short';
    else if (ownerName.length < 2) error = 'Owner name is required';
    else if (!/^03\d{9}$/.test(ownerPhone)) error = 'Enter a valid mobile number like 03001234567';
    else if (!area) error = 'Area is required';
    else if (!city) error = 'City is required';
    else if (!Number.isInteger(avg) || avg < 3 || avg > 60) error = 'Average minutes per patient must be between 3 and 60';
    else if (!/^\d{4,6}$/.test(pin)) error = 'PIN must be 4 to 6 digits';
    if (error) return send(res, 400, { ok: false, error });

    const base = clinicName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
    const slug = base + '-' + Math.random().toString(36).slice(2, 6);
    const rows = await db('clinics', {
      method: 'POST',
      body: JSON.stringify({ name: clinicName, slug, owner_name: ownerName, owner_phone: ownerPhone, area, city, avg_minutes: avg, staff_pin: pin })
    });
    const id = rows[0].id;
    const site = `https://${req.headers.host}`;
    return send(res, 200, {
      ok: true,
      clinic_id: id,
      status: 'pending',
      patient_link: `${site}/find.html?clinic=${id}`,
      receptionist_link: `${site}/receptionist.html?clinic=${id}`,
      message: 'Aapki clinic register ho gayi hai. Active hone ke baad patients ko list mein nazar aayegi.'
    });
  } catch (e) {
    return send(res, 500, { ok: false, error: 'Server error. Please try again.' });
  }
};
