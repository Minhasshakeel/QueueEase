const { db, today, send } = require('../lib/db');

module.exports = async (req, res) => {
  try {
    const [clinics, waiting] = await Promise.all([
      db('clinics?is_listed=eq.true&status=eq.active&select=id,name,area,city,avg_minutes'),
      db(`tokens?queue_date=eq.${today()}&status=eq.waiting&select=clinic_id`)
    ]);
    const counts = {};
    waiting.forEach(t => { counts[t.clinic_id] = (counts[t.clinic_id] || 0) + 1; });
    const list = clinics.map(c => {
      const n = counts[c.id] || 0;
      return { id: c.id, name: c.name, area: c.area, city: c.city, waiting: n, estimated_minutes: n * (c.avg_minutes || 10) };
    }).sort((a, b) => a.waiting - b.waiting);
    return send(res, 200, { clinics: list });
  } catch (e) {
    return send(res, 500, { clinics: [], error: 'Server error' });
  }
};
