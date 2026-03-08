-- Migration: Add Referral Code System
-- Description: Add referral_codes table and update payment_transactions to track referrals
-- Date: 2026-03-07

-- Create referral_codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  discount_percent INTEGER NOT NULL DEFAULT 10,
  usage_count INTEGER NOT NULL DEFAULT 0,
  max_usage INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_active ON referral_codes(is_active) WHERE is_active = TRUE;

-- Add referral tracking columns to payment_transactions
ALTER TABLE payment_transactions 
  ADD COLUMN IF NOT EXISTS original_amount INTEGER,
  ADD COLUMN IF NOT EXISTS discount_amount INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS referral_owner_id TEXT;

-- Add index for referral code lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_referral_code ON payment_transactions(referral_code);

-- Backfill original_amount with current amount for existing records
UPDATE payment_transactions 
SET original_amount = amount 
WHERE original_amount IS NULL;

COMMENT ON TABLE referral_codes IS 'Stores user referral codes for discount tracking';
COMMENT ON COLUMN referral_codes.code IS 'Unique referral code (e.g., STORIFY-ABC123)';
COMMENT ON COLUMN referral_codes.user_id IS 'User ID who owns this referral code';
COMMENT ON COLUMN referral_codes.discount_percent IS 'Discount percentage for this code (default 10%)';
COMMENT ON COLUMN referral_codes.usage_count IS 'Number of times this code has been used';
COMMENT ON COLUMN referral_codes.max_usage IS 'Maximum usage limit (NULL = unlimited)';
COMMENT ON COLUMN referral_codes.is_active IS 'Whether code is currently active';
COMMENT ON COLUMN referral_codes.expires_at IS 'Expiration date (NULL = never expires)';

COMMENT ON COLUMN payment_transactions.original_amount IS 'Original price before discount';
COMMENT ON COLUMN payment_transactions.discount_amount IS 'Discount amount applied';
COMMENT ON COLUMN payment_transactions.referral_code IS 'Referral code used (if any)';
COMMENT ON COLUMN payment_transactions.referral_owner_id IS 'User ID of referral code owner';
