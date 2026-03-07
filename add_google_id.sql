-- Add google_id column to users table safely
-- Run this SQL manually in your PostgreSQL database

-- Add google_id column (VARCHAR, UNIQUE, NULLABLE)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_id VARCHAR UNIQUE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_google_id 
ON users(google_id);

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
