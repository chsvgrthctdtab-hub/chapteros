-- Migration: Update members status check constraint to active and alumni only
-- Clean up any legacy inactive or transferred status data to active or alumni

UPDATE members
SET status = 'active'
WHERE status NOT IN ('active', 'alumni');

-- Drop old check constraint if named, or re-apply constraint on status column
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_status_check;
ALTER TABLE members ADD CONSTRAINT members_status_check CHECK (status IN ('active', 'alumni'));
