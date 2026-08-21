import pool from '../config/database.js';
import { TIER_PARAMS } from './ppmService.js';

export async function getCreatorTier(creatorId) {
  const { rows } = await pool.query(
    'SELECT plan FROM users WHERE id = $1',
    [creatorId]
  );
  const plan = rows[0]?.plan || 'student';
  return TIER_PARAMS[plan] ? plan : 'student';
}

export async function getCreatorProfile(creatorId) {
  const { rows } = await pool.query(
    `SELECT cp.*, u.plan, u.email, u.name
     FROM creator_profiles cp
     JOIN users u ON u.id = cp.user_id
     WHERE cp.user_id = $1`,
    [creatorId]
  );
  return rows[0] || null;
}

export async function updateCreatorBaseRate(creatorId, baseRate) {
  const tier = await getCreatorTier(creatorId);
  const params = TIER_PARAMS[tier];
  const clampedRate = Math.min(Math.max(baseRate, params.min_ppm), params.max_ppm);
  
  await pool.query(
    `INSERT INTO creator_ppm_config (creator_id, base_rate, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (creator_id) DO UPDATE SET base_rate = $2, updated_at = NOW()`,
    [creatorId, clampedRate]
  );
  return { base_rate: clampedRate, tier };
}

export async function getCreatorEarningsSummary(creatorId) {
  const { rows } = await pool.query(`
    SELECT 
      type,
      COALESCE(SUM(amount_ngn), 0) as total
    FROM creator_wallet_transactions
    WHERE creator_id = $1 AND amount_ngn > 0
    GROUP BY type
  `, [creatorId]);
  
  const summary = { total: 0 };
  rows.forEach(r => {
    summary[r.type] = parseFloat(r.total);
    summary.total += parseFloat(r.total);
  });
  return summary;
}