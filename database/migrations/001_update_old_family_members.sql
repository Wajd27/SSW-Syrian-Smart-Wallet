-- Migration: Update old family members to have is_active = true if NULL
-- This handles family members created before the is_active field was properly set

-- Set is_active = true for family members that have NULL is_active
-- This ensures backward compatibility with old data
UPDATE family_members 
SET is_active = true 
WHERE is_active IS NULL;

-- Add comment to document this migration
COMMENT ON COLUMN family_members.is_active IS 'Boolean flag indicating if family member is active. Defaults to true for backward compatibility.';

