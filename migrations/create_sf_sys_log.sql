-- Create sf_sys_log table for comprehensive user action logging
CREATE TABLE IF NOT EXISTS sf_sys_log (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  user_email TEXT,
  user_name TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sf_sys_log_user_id ON sf_sys_log(user_id);
CREATE INDEX IF NOT EXISTS idx_sf_sys_log_action ON sf_sys_log(action);
CREATE INDEX IF NOT EXISTS idx_sf_sys_log_created_at ON sf_sys_log(created_at);
