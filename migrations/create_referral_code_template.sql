-- Template untuk membuat kode referral baru
-- Copy dan edit query sesuai kebutuhan

-- =====================================================
-- CONTOH 1: Kode Promo Umum (tanpa pemilik spesifik)
-- =====================================================
INSERT INTO referral_codes (
  code, 
  user_id, 
  discount_percent, 
  commission_percent,
  usage_count,
  max_usage,
  is_active, 
  expires_at
) VALUES (
  'LEBARAN2026',           -- Kode referral (UPPERCASE)
  'system-promo',          -- User ID pemilik (pakai 'system-promo' untuk kode promo umum)
  25,                      -- Diskon dalam persen (25%)
  0,                       -- Komisi untuk pemilik (0% untuk promo umum)
  0,                       -- Usage count (mulai dari 0)
  100,                     -- Max usage (NULL untuk unlimited, atau angka maksimal penggunaan)
  true,                    -- is_active (true = aktif, false = nonaktif)
  '2026-04-30 23:59:59'    -- Tanggal expired (NULL untuk tidak pernah expired)
);

-- =====================================================
-- CONTOH 2: Kode Referral User (dengan komisi)
-- =====================================================
INSERT INTO referral_codes (
  code, 
  user_id, 
  discount_percent, 
  commission_percent,
  usage_count,
  max_usage,
  is_active, 
  expires_at
) VALUES (
  'STORIFY-ABC123',        -- Kode referral (UPPERCASE)
  'user_12345',            -- User ID pemilik kode (user yang dapat komisi)
  10,                      -- Diskon 10% untuk yang pakai kode
  5,                       -- Komisi 5% untuk pemilik kode
  0,                       -- Usage count (mulai dari 0)
  NULL,                    -- Max usage (NULL = unlimited)
  true,                    -- is_active
  NULL                     -- Tidak ada expiry date
);

-- =====================================================
-- CONTOH 3: Flash Sale / Limited Time Offer
-- =====================================================
INSERT INTO referral_codes (
  code, 
  user_id, 
  discount_percent, 
  commission_percent,
  usage_count,
  max_usage,
  is_active, 
  expires_at
) VALUES (
  'FLASHSALE24H',          -- Kode flash sale
  'system-promo',          -- System promo
  50,                      -- Diskon besar 50%
  0,                       -- Tanpa komisi
  0,                       -- Usage count
  50,                      -- Terbatas 50 orang saja
  true,                    -- Aktif
  NOW() + INTERVAL '24 hours'  -- Expired dalam 24 jam
);

-- =====================================================
-- CONTOH 4: Kode Referral Influencer
-- =====================================================
INSERT INTO referral_codes (
  code, 
  user_id, 
  discount_percent, 
  commission_percent,
  usage_count,
  max_usage,
  is_active, 
  expires_at
) VALUES (
  'INFLUENCER15',          -- Kode influencer
  'influencer_user_id',    -- User ID influencer
  15,                      -- Diskon 15%
  10,                      -- Komisi 10% untuk influencer
  0,                       -- Usage count
  NULL,                    -- Unlimited usage
  true,                    -- Aktif
  '2026-12-31 23:59:59'    -- Expired akhir tahun
);

-- =====================================================
-- QUERY UNTUK CEK KODE YANG SUDAH ADA
-- =====================================================
SELECT 
  id,
  code,
  user_id,
  discount_percent,
  commission_percent,
  usage_count,
  max_usage,
  is_active,
  expires_at,
  created_at
FROM referral_codes
ORDER BY created_at DESC;

-- =====================================================
-- QUERY UNTUK UPDATE KODE (nonaktifkan/ubah)
-- =====================================================
-- Nonaktifkan kode
UPDATE referral_codes 
SET is_active = false 
WHERE code = 'KODE_YANG_MAU_DINONAKTIFKAN';

-- Update diskon
UPDATE referral_codes 
SET discount_percent = 30 
WHERE code = 'KODE_YANG_MAU_DIUBAH';

-- Perpanjang expired date
UPDATE referral_codes 
SET expires_at = '2026-12-31 23:59:59' 
WHERE code = 'KODE_YANG_MAU_DIPERPANJANG';

-- =====================================================
-- QUERY UNTUK HAPUS KODE
-- =====================================================
DELETE FROM referral_codes 
WHERE code = 'KODE_YANG_MAU_DIHAPUS';
