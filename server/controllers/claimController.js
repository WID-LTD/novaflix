import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';
import { personaService } from '../services/personaService.js';
import { searchPerson, getPersonCredits } from '../services/tmdbService.js';
import { getCreatorTier } from '../services/creatorService.js';

export async function startClaim(req, res) {
  try {
    const { tmdbPersonId, displayName } = req.body;
    if (!tmdbPersonId) return res.status(400).json({ error: 'TMDB person ID required' });

    // Check if already claimed
    const existing = await pool.query(
      'SELECT cp.user_id FROM creator_profiles cp WHERE cp.tmdb_person_id = $1',
      [tmdbPersonId]
    );
    if (existing.rows[0]?.user_id) {
      return res.status(409).json({ error: 'This profile is already claimed' });
    }

    // Check for existing pending claim
    const pending = await pool.query(
      'SELECT id FROM creator_claim_requests WHERE tmdb_person_id = $1 AND claim_status = $2',
      [tmdbPersonId, 'pending']
    );
    if (pending.rows[0]) {
      return res.status(409).json({ error: 'Claim already in progress', claimId: pending.rows[0].id });
    }

    // Get TMDB data for preview
    const [person, credits] = await Promise.all([
      searchPerson(tmdbPersonId),
      getPersonCredits(tmdbPersonId)
    ]);

    const claimId = uuidv4();
    const inquiry = await personaService.createInquiry({
      referenceId: claimId,
      fields: {
        firstName: displayName?.split(' ')[0] || '',
        lastName: displayName?.split(' ').slice(1).join(' ') || '',
        email: req.user?.email || ''
      }
    });

    await pool.query(
      `INSERT INTO creator_claim_requests 
       (id, tmdb_person_id, display_name, persona_inquiry_id, persona_template_id, claim_status, kyc_status)
       VALUES ($1, $2, $3, $4, $5, 'pending', 'pending')`,
      [claimId, tmdbPersonId, displayName, inquiry.id, process.env.PERSONA_TEMPLATE_ID]
    );

    // Get estimated earnings from scraped content
    const estimatedEarnings = await getEstimatedEarnings(tmdbPersonId);

    res.json({
      success: true,
      claimId,
      inquiryId: inquiry.id,
      personaConfig: personaService.getFrontendConfig(),
      preview: {
        name: person.name,
        profilePath: person.profile_path,
        knownFor: person.known_for_department,
        filmCount: credits.cast?.length + credits.crew?.length || 0,
        estimatedMonthlyEarnings: estimatedEarnings
      }
    });
  } catch (err) {
    console.error('[claim] startClaim error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function getClaimStatus(req, res) {
  try {
    const { claimId } = req.params;
    const { rows } = await pool.query(
      `SELECT id, tmdb_person_id, display_name, claim_status, kyc_status, 
              persona_inquiry_id, created_at, reviewed_at
       FROM creator_claim_requests WHERE id = $1`,
      [claimId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Claim not found' });
    res.json({ success: true, claim: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getClaimPreview(req, res) {
  try {
    const { tmdbPersonId } = req.params;
    const [person, credits] = await Promise.all([
      searchPerson(tmdbPersonId),
      getPersonCredits(tmdbPersonId)
    ]);
    const estimatedEarnings = await getEstimatedEarnings(tmdbPersonId);
    res.json({ success: true, preview: { person, credits, estimatedEarnings } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function handlePersonaWebhook(req, res) {
  try {
    const signature = req.headers['persona-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);
    
    const event = personaService.parseWebhookEvent(rawBody, signature);
    
    if (event.type === 'inquiry.approved' || event.type === 'inquiry.completed') {
      const inquiryId = event.data.id;
      const referenceId = event.data.attributes['reference-id'];
      
      await handleInquiryApproved(inquiryId, referenceId);
    } else if (event.type === 'inquiry.declined' || event.type === 'inquiry.expired') {
      const inquiryId = event.data.id;
      const referenceId = event.data.attributes['reference-id'];
      
      await pool.query(
        `UPDATE creator_claim_requests 
         SET kyc_status = $1, claim_status = 'denied', reviewed_at = NOW()
         WHERE persona_inquiry_id = $2`,
        [event.type === 'inquiry.declined' ? 'denied' : 'expired', inquiryId]
      );
    }
    
    res.sendStatus(200);
  } catch (err) {
    console.error('[claim] webhook error:', err.message);
    res.sendStatus(200); // Always 200 to prevent retries
  }
}

async function handleInquiryApproved(inquiryId, claimId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { rows: claimRows } = await client.query(
      'SELECT * FROM creator_claim_requests WHERE id = $1 FOR UPDATE',
      [claimId]
    );
    
    if (!claimRows[0]) throw new Error('Claim not found');
    const claim = claimRows[0];
    
    if (claim.claim_status === 'approved') {
      await client.query('COMMIT');
      return;
    }

    // AUTO-APPROVE: Persona is single source of truth
    await client.query(
      `UPDATE creator_claim_requests 
       SET kyc_status = 'approved', claim_status = 'approved', reviewed_at = NOW()
       WHERE id = $1`,
      [claimId]
    );

    // Get or create user
    let userId;
    const inquiry = await personaService.getInquiry(inquiryId);
    const email = inquiry.data.attributes.fields?.['email-address']?.value;
    
    if (email) {
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows[0]) {
        userId = existing.rows[0].id;
      }
    }
    
    if (!userId) {
      // Create new user
      userId = uuidv4();
      await client.query(
        `INSERT INTO users (id, email, name, role, plan, email_verified)
         VALUES ($1, $2, $3, 'creator', 'free', true)`,
        [userId, email || `${claim.tmdb_person_id}@novaflix.claim`, claim.display_name || 'Creator']
      );
    }

    // Link creator profile to user
    await client.query(
      `UPDATE creator_profiles SET user_id = $1 WHERE tmdb_person_id = $2`,
      [userId, claim.tmdb_person_id]
    );
    
    // Link user to claimed profile
    await client.query(
      `UPDATE users SET claimed_creator_profile_id = (SELECT id FROM creator_profiles WHERE tmdb_person_id = $1) WHERE id = $2`,
      [claim.tmdb_person_id, userId]
    );

    // Initialize creator PPM config
    await client.query(
      `INSERT INTO creator_ppm_config (creator_id, base_rate) VALUES ($1, 10.00)
       ON CONFLICT (creator_id) DO NOTHING`,
      [userId]
    );

    await client.query('COMMIT');
    console.log(`[claim] Auto-approved claim ${claimId} for user ${userId}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[claim] handleInquiryApproved error:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

async function getEstimatedEarnings(tmdbPersonId) {
  try {
    // Get films linked to this TMDB person
    const { rows } = await pool.query(
      `SELECT COUNT(*) as film_count FROM scraped_content_links WHERE creator_tmdb_person_id = $1`,
      [tmdbPersonId]
    );
    const filmCount = parseInt(rows[0]?.film_count) || 0;
    
    // Rough estimate: avg 5000 min/month per film × ₦2 baseline × 1.25 multiplier (standard tier)
    const estimatedMonthly = filmCount * 5000 * 2.0 * 1.25;
    return Math.round(estimatedMonthly);
  } catch {
    return 0;
  }
}

// Admin endpoints
export async function adminListClaims(req, res) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let where = '';
    const params = [limit, offset];
    if (status) {
      where = 'WHERE claim_status = $3';
      params.push(status);
    }
    
    const { rows } = await pool.query(
      `SELECT ccr.*, u.email as claimant_email 
       FROM creator_claim_requests ccr
       LEFT JOIN users u ON u.id = ccr.user_id
       ${where}
       ORDER BY ccr.created_at DESC
       LIMIT $1 OFFSET $2`,
      params
    );
    
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) FROM creator_claim_requests ${where.replace('WHERE', '')}`,
      status ? [status] : []
    );
    
    res.json({ success: true, claims: rows, total: parseInt(countRows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function adminApproveClaim(req, res) {
  try {
    const { claimId } = req.params;
    await handleInquiryApproved(null, claimId); // Manual approval bypasses Persona
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function adminDenyClaim(req, res) {
  try {
    const { claimId } = req.params;
    const { reason } = req.body;
    
    await pool.query(
      `UPDATE creator_claim_requests 
       SET claim_status = 'denied', kyc_status = 'denied', reviewed_by = $1, reviewed_at = NOW()
       WHERE id = $2`,
      [req.userId, claimId]
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}