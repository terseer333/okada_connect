import { pool } from '../config/db.js';

const STATUSES = ['offline', 'online', 'busy'];

export async function getProfile(req, res, next) {
  try {
    const result = await pool.query('SELECT * FROM riders WHERE user_id = $1', [req.user.id]);
    const rider = result.rows[0];

    if (!rider) {
      return res.status(404).json({ error: 'Rider profile not found' });
    }

    res.json({ rider });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const { availabilityStatus } = req.body;

    if (!STATUSES.includes(availabilityStatus)) {
      return res.status(400).json({ error: `availabilityStatus must be one of: ${STATUSES.join(', ')}` });
    }

    const result = await pool.query(
      `UPDATE riders
       SET availability_status = $1, updated_at = now()
       WHERE user_id = $2
       RETURNING *`,
      [availabilityStatus, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Rider profile not found' });
    }

    res.json({ rider: result.rows[0] });
  } catch (err) {
    next(err);
  }
}
