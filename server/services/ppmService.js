import pool from '../config/database.js';

export const TIER_PARAMS = {
  student: { min_ppm: 5, max_ppm: 100, multiplier: 0.75, subscription_price_ngn: 800 },
  basic:   { min_ppm: 5, max_ppm: 200, multiplier: 1.00, subscription_price_ngn: 1500 },
  standard:{ min_ppm: 10, max_ppm: 300, multiplier: 1.25, subscription_price_ngn: 2500 },
  premium: { min_ppm: 20, max_ppm: 500, multiplier: 1.50, subscription_price_ngn: 5500 }
};

let baselineVPMCache = {
  movie: { vpm: 2.0000, updatedAt: 0 },
  shorts: { vpm: 0.2000, updatedAt: 0 },
  live: { vpm: 1.0000, updatedAt: 0 }
};

export async function getCachedBaselineVPM(contentType) {
  const cached = baselineVPMCache[contentType];
  if (cached && Date.now() - cached.updatedAt < 3600000) { // 1 hour
    return cached.vpm;
  }
  // Fallback to DB
  const { rows } = await pool.query(
    'SELECT baseline_vpm FROM baseline_vpm_cache WHERE content_type = $1',
    [contentType]
  );
  return rows[0]?.baseline_vpm || (contentType === 'shorts' ? 0.20 : contentType === 'live' ? 1.00 : 2.00);
}

export function updateBaselineVPMCache(contentType, vpm) {
  baselineVPMCache[contentType] = { vpm, updatedAt: Date.now() };
}

// Called by hourly cron
export async function refreshBaselineVPM() {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

  try {
    // Movie pool (80% of 60% = 48% of net revenue)
    const movieRevenue = await getPoolRevenue('movie', periodStart, now);
    const movieMinutes = await getTotalMinutes('movie', periodStart, now);
    const movieVPM = movieMinutes > 0 ? movieRevenue / movieMinutes : 2.00;

    // Shorts pool (20% of 60% = 12% of net revenue)
    const shortsRevenue = await getPoolRevenue('shorts', periodStart, now);
    const shortsMinutes = await getTotalMinutes('shorts', periodStart, now);
    const shortsVPM = shortsMinutes > 0 ? shortsRevenue / shortsMinutes : 0.20;

    // Live pool (treated as shorts)
    const liveRevenue = await getPoolRevenue('live', periodStart, now);
    const liveMinutes = await getTotalMinutes('live', periodStart, now);
    const liveVPM = liveMinutes > 0 ? liveRevenue / liveMinutes : 1.00;

    await pool.query(`
      INSERT INTO baseline_vpm_cache (content_type, baseline_vpm, total_pool_ngn, total_minutes, calculated_at)
      VALUES ('movie', $1, $2, $3, NOW()), ('shorts', $4, $5, $6, NOW()), ('live', $7, $8, $9, NOW())
      ON CONFLICT (content_type) DO UPDATE SET 
        baseline_vpm = EXCLUDED.baseline_vpm,
        total_pool_ngn = EXCLUDED.total_pool_ngn,
        total_minutes = EXCLUDED.total_minutes,
        calculated_at = NOW()
    `, [movieVPM, movieRevenue, movieMinutes, shortsVPM, shortsRevenue, shortsMinutes, liveVPM, liveRevenue, liveMinutes]);

    updateBaselineVPMCache('movie', movieVPM);
    updateBaselineVPMCache('shorts', shortsVPM);
    updateBaselineVPMCache('live', liveVPM);

    console.log(`[PPM] Baseline VPM updated: movie=${movieVPM.toFixed(4)}, shorts=${shortsVPM.toFixed(4)}, live=${liveVPM.toFixed(4)}`);
  } catch (err) {
    console.error('[PPM] refreshBaselineVPM error:', err.message);
  }
}

async function getPoolRevenue(contentType, from, to) {
  // 60% of net revenue goes to creators, split 80/20 for movie/shorts
  const { rows } = await pool.query(`
    SELECT COALESCE(SUM(amount_ngn), 0) as total
    FROM creator_wallet_transactions cwt
    JOIN creator_profiles cp ON cp.user_id = cwt.creator_id
    WHERE cwt.type LIKE 'ppm_%' 
      AND cwt.created_at >= $1 AND cwt.created_at < $2
      AND ($3 = 'all' OR cwt.type = 'ppm_' || $3)
  `, [from, to, contentType === 'live' ? 'shorts' : contentType]);
  return parseFloat(rows[0]?.total) || 0;
}

async function getTotalMinutes(contentType, from, to) {
  const { rows } = await pool.query(`
    SELECT COALESCE(SUM((metadata->>'minutesWatched')::numeric), 0) as total
    FROM creator_wallet_transactions
    WHERE type LIKE 'ppm_%' 
      AND created_at >= $1 AND created_at < $2
      AND ($3 = 'all' OR type = 'ppm_' || $3)
  `, [from, to, contentType === 'live' ? 'shorts' : contentType]);
  return parseFloat(rows[0]?.total) || 0;
}

export async function getCreatorTier(creatorId) {
  const { rows } = await pool.query(
    `SELECT plan FROM users WHERE id = $1`,
    [creatorId]
  );
  const plan = rows[0]?.plan || 'student';
  return TIER_PARAMS[plan] ? plan : 'student';
}

export async function getCreatorPPMConfig(creatorId) {
  const { rows } = await pool.query(
    'SELECT base_rate FROM creator_ppm_config WHERE creator_id = $1',
    [creatorId]
  );
  return rows[0] || { base_rate: 10.00 };
}

export async function updateCreatorPPMConfig(creatorId, baseRate) {
  const tier = await getCreatorTier(creatorId);
  const params = TIER_PARAMS[tier];
  const clampedRate = Math.min(Math.max(baseRate, params.min_ppm), params.max_ppm);
  
  await pool.query(
    `INSERT INTO creator_ppm_config (creator_id, base_rate, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (creator_id) DO UPDATE SET base_rate = $2, updated_at = NOW()`,
    [creatorId, clampedRate]
  );
  return { base_rate: clampedRate };
}