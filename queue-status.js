const { db, today, send } = require('../lib/db');

module.exports = async (req, res) => {
  try {
    const myToken = Number(req.query.token);
    const clinicId = Number(req.query.clinic_id || 1);
    if (!Number.isInteger(myToken) || !Number.isInteger(clinicId)) return send(res, 400, { found: false });

    const [clinic, rows] = await Promise.all([
      db(`clinics?id=eq.${clinicId}&select=avg_minutes`),
      db(`tokens?clinic_id=eq.${clinicId}&queue_date=eq.${today()}&select=token_number,status`)
    ]);
    const minutes = (clinic[0] && clinic[0].avg_minutes) || 10;
    const mine = rows.find(r => r.token_number === myToken);
    if (!mine) return send(res, 200, { found: false, message: 'Ye token nahi mila' });

    const called = rows.filter(r => r.status === 'called').map(r => r.token_number);
    const waiting = rows.filter(r => r.status === 'waiting');
    const ahead = mine.status === 'waiting' ? waiting.filter(r => r.token_number < myToken).length : 0;
    return send(res, 200, {
      found: true,
      your_token: myToken,
      your_status: mine.status,
      now_serving: called.length ? Math.max(...called) : null,
      patients_ahead: ahead,
      estimated_minutes: ahead * minutes
    });
  } catch (e) {
    return send(res, 500, { found: false, error: 'Server error' });
  }
};
