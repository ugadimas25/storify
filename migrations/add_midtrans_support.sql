-- Migration: Add Midtrans Payment Gateway Support
-- Date: 2026-03-08
-- Description: Add Midtrans-specific fields to payment_transactions table

-- Add Midtrans specific columns
ALTER TABLE payment_transactions
ADD COLUMN IF NOT EXISTS midtrans_order_id TEXT,
ADD COLUMN IF NOT EXISTS midtrans_snap_token TEXT,
ADD COLUMN IF NOT EXISTS midtrans_redirect_url TEXT,
ADD COLUMN IF NOT EXISTS midtrans_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS midtrans_payment_type TEXT,
ADD COLUMN IF NOT EXISTS midtrans_transaction_time TEXT,
ADD COLUMN IF NOT EXISTS midtrans_transaction_status TEXT;

-- Create index for faster lookup by Midtrans order ID (used in webhooks)
CREATE INDEX IF NOT EXISTS idx_payment_transactions_midtrans_order_id 
ON payment_transactions(midtrans_order_id);

-- Update payment_gateway column comment to include midtrans
COMMENT ON COLUMN payment_transactions.payment_gateway IS 'Payment gateway: doku | qris_pewaca | midtrans';

-- Verify migration
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'payment_transactions' 
    AND column_name = 'midtrans_order_id'
  ) THEN
    RAISE NOTICE 'Migration successful: Midtrans columns added to payment_transactions';
  ELSE
    RAISE EXCEPTION 'Migration failed: Midtrans columns not found';
  END IF;
END $$;
