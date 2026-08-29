-- 006_creator_auth_architecture.sql
-- Backfill creator_profiles with new columns and sync approval status

-- Backfill stage_name from users.name where display_name is null
UPDATE creator_profiles cp
SET stage_name = COALESCE(cp.display_name, u.name)
FROM users u
WHERE cp.user_id = u.id AND cp.stage_name IS NULL;

-- Backfill category from known_for_department
UPDATE creator_profiles
SET category = known_for_department
WHERE category IS NULL AND known_for_department IS NOT NULL;

-- Mark all existing creator_profiles as approved (they were already active creators)
UPDATE creator_profiles
SET approval_status = 'approved', approved_at = created_at
WHERE approval_status IS NULL;

-- Sync creator_approved flag on users table for existing creators
UPDATE users u
SET creator_approved = TRUE
WHERE u.role = 'creator'
  AND EXISTS (
    SELECT 1 FROM creator_profiles cp
    WHERE cp.user_id = u.id AND cp.approval_status = 'approved'
  );

-- Sync from approved claims
UPDATE users u
SET creator_approved = TRUE, role = 'creator'
WHERE EXISTS (
  SELECT 1 FROM creator_claim_requests ccr
  WHERE ccr.user_id = u.id AND ccr.claim_status = 'approved'
);
