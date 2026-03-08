# Midtrans Payment Integration Guide

## Overview
Storify mengintegrasikan **Midtrans Snap** sebagai salah satu pilihan payment gateway untuk subscription berbayar. Midtrans menyediakan berbagai metode pembayaran termasuk Credit Card, GoPay, ShopeePay, QRIS, Bank Transfer, dan e-wallet lainnya.

## Features
- ✅ Create Snap payment transaction
- ✅ Multiple payment methods (Credit Card, E-wallet, Bank Transfer, QRIS)
- ✅ Webhook notification for automatic payment status update
- ✅ Referral code support with automatic discount & commission
- ✅ Transaction history tracking
- ✅ Secure signature verification

## Prerequisites

### 1. Midtrans Account Setup

#### Sandbox (Development/Testing)
1. Register at https://dashboard.sandbox.midtrans.com
2. Login → Click your name → **Settings** → **Access Keys**
3. Copy:
   - **Server Key** (secret, untuk backend)
   - **Client Key** (untuk frontend)

#### Production
1. Register at https://dashboard.midtrans.com
2. Complete business verification (butuh dokumen)
3. Aktivasi approval dari Midtrans
4. Get Server Key & Client Key

### 2. Configure Payment Methods
Di Midtrans Dashboard → **Settings** → **Payment Methods**:
- ✅ Credit Card (Visa, Mastercard, JCB, Amex)
- ✅ GoPay
- ✅ ShopeePay
- ✅ QRIS (all e-wallet)
- ✅ Bank Transfer (BCA, Mandiri, BNI, Permata)
- ✅ Convenience Store (Indomaret, Alfamart)

### 3. Configure Notification URL (Webhook)
Di **Settings** → **Configuration** → **Payment Notification URL**:

**Production:**
```
https://yourdomain.com/api/webhook/midtrans
```

**Development (dengan ngrok/localtunnel):**
```bash
# Install localtunnel
npm install -g localtunnel

# Run your app (port 5000)
npm run dev

# In another terminal, expose to public
lt --port 5000

# You'll get URL like: https://abc123.loca.lt
# Set in Midtrans: https://abc123.loca.lt/api/webhook/midtrans
```

### 4. Configure Redirect URLs (Optional)
Di **Settings** → **Snap Preferences**:
- **Finish URL**: `https://yourdomain.com/subscription?payment=success`
- **Error URL**: `https://yourdomain.com/subscription?payment=failed`
- **Unfinish URL**: `https://yourdomain.com/subscription?payment=pending`

## Environment Variables

Add to your `.env` file:

```bash
# Midtrans Configuration
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxx    # Sandbox: SB-Mid-server-xxx, Production: Mid-server-xxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxx    # Sandbox: SB-Mid-client-xxx, Production: Mid-client-xxx
MIDTRANS_IS_PRODUCTION=false                     # false = sandbox, true = production

# App URL for callbacks
APP_URL=https://yourdomain.com                   # Or http://localhost:5000 for development
```

## Database Migration

Run the following SQL to add Midtrans fields to `payment_transactions` table:

```sql
-- Add Midtrans specific columns
ALTER TABLE payment_transactions
ADD COLUMN IF NOT EXISTS midtrans_order_id TEXT,
ADD COLUMN IF NOT EXISTS midtrans_snap_token TEXT,
ADD COLUMN IF NOT EXISTS midtrans_redirect_url TEXT,
ADD COLUMN IF NOT EXISTS midtrans_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS midtrans_payment_type TEXT,
ADD COLUMN IF NOT EXISTS midtrans_transaction_time TEXT,
ADD COLUMN IF NOT EXISTS midtrans_transaction_status TEXT;

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_payment_transactions_midtrans_order_id 
ON payment_transactions(midtrans_order_id);

-- Update payment_gateway enum to include midtrans
COMMENT ON COLUMN payment_transactions.payment_gateway IS 'Payment gateway: doku | qris_pewaca | midtrans';
```

Save this as `migrations/add_midtrans_support.sql` and run:
```bash
psql -U your_user -d your_database -f migrations/add_midtrans_support.sql
```

## API Endpoints

### 1. Create Midtrans Snap Payment

**Endpoint:** `POST /api/midtrans/payment/create`

**Auth:** Required (Bearer token)

**Request Body:**
```json
{
  "planId": 1,
  "referralCode": "STORIFY123" // optional
}
```

**Response:**
```json
{
  "id": 42,
  "userId": "user-123",
  "planId": 1,
  "amount": 90000,
  "originalAmount": 100000,
  "discountAmount": 10000,
  "referralCode": "STORIFY123",
  "status": "pending",
  "paymentGateway": "midtrans",
  "midtransOrderId": "STORIFY-1709856000000-123",
  "snapToken": "66e4fa55-xxxxx-xxxxx-xxxxx-xxxxxxxxxx",
  "redirectUrl": "https://app.sandbox.midtrans.com/snap/v3/redirection/66e4fa55-xxxxx",
  "expiredAt": "2026-03-09T12:00:00.000Z",
  "createdAt": "2026-03-08T12:00:00.000Z"
}
```

### 2. Get Transaction Status

**Endpoint:** `GET /api/midtrans/payment/:orderId/status`

**Auth:** Required

**Response:**
```json
{
  "orderId": "STORIFY-1709856000000-123",
  "transactionId": "abc123-def456",
  "status": "settlement",
  "paymentType": "gopay",
  "grossAmount": "90000",
  "transactionTime": "2026-03-08 12:05:30",
  "isSuccess": true,
  "message": "Payment successful"
}
```

### 3. Webhook Notification (Internal)

**Endpoint:** `POST /api/webhook/midtrans`

**Auth:** None (verified by signature)

This endpoint is called by Midtrans automatically when payment status changes.

## Frontend Implementation

### Install Midtrans Snap SDK

```bash
npm install --save midtrans-client
```

Or use CDN in HTML:
```html
<script src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key="YOUR_CLIENT_KEY"></script>
```

### React/TypeScript Example

```typescript
// Step 1: Create payment transaction
const createPayment = async (planId: number, referralCode?: string) => {
  const response = await fetch('/api/midtrans/payment/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ planId, referralCode })
  });
  
  const data = await response.json();
  return data;
};

// Step 2: Open Snap payment page
const openSnapPayment = (snapToken: string) => {
  // @ts-ignore
  window.snap.pay(snapToken, {
    onSuccess: function(result: any) {
      console.log('Payment success:', result);
      // Redirect to success page or show success message
      window.location.href = '/subscription?payment=success';
    },
    onPending: function(result: any) {
      console.log('Payment pending:', result);
      window.location.href = '/subscription?payment=pending';
    },
    onError: function(result: any) {
      console.error('Payment error:', result);
      window.location.href = '/subscription?payment=failed';
    },
    onClose: function() {
      console.log('Payment popup closed');
    }
  });
};

// Usage in component
const handleSubscribe = async () => {
  try {
    const payment = await createPayment(selectedPlanId, referralCode);
    openSnapPayment(payment.snapToken);
  } catch (error) {
    console.error('Failed to create payment:', error);
  }
};
```

### Alternative: Redirect to Snap URL

Instead of using Snap popup, you can redirect user to Snap payment page:

```typescript
const payment = await createPayment(planId, referralCode);
window.location.href = payment.redirectUrl;
```

## Payment Flow

```
┌─────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│  User   │       │ Frontend │       │ Backend  │       │ Midtrans │
└────┬────┘       └────┬─────┘       └────┬─────┘       └────┬─────┘
     │                 │                   │                   │
     │ 1. Click Bayar  │                   │                   │
     ├────────────────>│                   │                   │
     │                 │                   │                   │
     │                 │ 2. POST /api/midtrans/payment/create  │
     │                 ├──────────────────>│                   │
     │                 │                   │                   │
     │                 │                   │ 3. Create Snap    │
     │                 │                   ├──────────────────>│
     │                 │                   │                   │
     │                 │                   │ 4. Snap Token +   │
     │                 │                   │    Redirect URL   │
     │                 │                   │<──────────────────┤
     │                 │                   │                   │
     │                 │ 5. snapToken      │                   │
     │                 │<──────────────────┤                   │
     │                 │                   │                   │
     │ 6. Open Snap    │                   │                   │
     │    Payment Page │                   │                   │
     │<────────────────┤                   │                   │
     │                 │                   │                   │
     │ 7. User Pilih Payment Method & Pay  │                   │
     ├────────────────────────────────────────────────────────>│
     │                 │                   │                   │
     │                 │                   │ 8. Webhook POST   │
     │                 │                   │    /api/webhook/  │
     │                 │                   │      midtrans     │
     │                 │                   │<──────────────────┤
     │                 │                   │                   │
     │                 │                   │ 9. Verify         │
     │                 │                   │    Signature      │
     │                 │                   │                   │
     │                 │                   │ 10. Create        │
     │                 │                   │     Subscription  │
     │                 │                   │                   │
     │ 11. Redirect to Success/Failed Page │                   │
     │<────────────────────────────────────┤                   │
     │                 │                   │                   │
```

## Transaction Status

Midtrans transaction statuses:

| Status | Description | Action |
|--------|-------------|--------|
| `pending` | Waiting for payment | Show pending message |
| `capture` | Credit card payment captured | Create subscription (if fraud_status = accept) |
| `settlement` | Payment settled | Create subscription |
| `deny` | Payment denied | Show failed message |
| `cancel` | Cancelled by user | Allow retry |
| `expire` | Payment expired | Allow retry |
| `refund` | Payment refunded | Deactivate subscription |

## Testing

### Test Cards (Sandbox Only)

**Success:**
```
Card Number: 4811 1111 1111 1114
Expiry: 01/25
CVV: 123
```

**Failure:**
```
Card Number: 4911 1111 1111 1113
Expiry: 01/25
CVV: 123
```

### Test E-wallets

Use Midtrans simulator app (download from dashboard) to simulate payment.

### Test QRIS

Scan QR code with any e-wallet app in sandbox mode.

## Webhook Signature Verification

Midtrans sends HTTP notification with signature for security:

```typescript
// Signature = SHA512(order_id + status_code + gross_amount + server_key)
const crypto = require('crypto');

const signatureString = orderId + statusCode + grossAmount + serverKey;
const expectedSignature = crypto
  .createHash('sha512')
  .update(signatureString)
  .digest('hex');

if (expectedSignature === notification.signature_key) {
  // Valid signature
} else {
  // Invalid - possible fraud
}
```

This is already implemented in `server/midtrans.ts`.

## Troubleshooting

### Webhook tidak diterima

**Problem:** Backend tidak menerima notification dari Midtrans

**Solutions:**
1. Pastikan Notification URL sudah diset di Midtrans Dashboard
2. Untuk development, gunakan ngrok/localtunnel untuk expose local server
3. Check logs di Midtrans Dashboard → **Transactions** → Click transaction → **Notification History**
4. Pastikan endpoint `/api/webhook/midtrans` tidak require authentication

### Signature verification failed

**Problem:** `Invalid signature for order`

**Solutions:**
1. Pastikan `MIDTRANS_SERVER_KEY` di `.env` sesuai dengan yang di Dashboard
2. Jangan tambahkan whitespace atau newline di env variable
3. Pastikan webhook body diterima sebagai JSON (express.json() middleware)

### Payment tidak create subscription

**Problem:** User bayar tapi subscription tidak aktif

**Solutions:**
1. Check webhook logs: `[Midtrans Webhook] Received notification`
2. Pastikan transaction status = `settlement` atau `capture`
3. Check database: `SELECT * FROM payment_transactions WHERE midtrans_order_id = 'xxx'`
4. Manual trigger: Hit endpoint `POST /api/payment/:transactionId/update` dengan status `paid`

### Snap popup tidak muncul

**Problem:** Frontend tidak bisa open Snap payment popup

**Solutions:**
1. Pastikan Snap.js SDK sudah di-load:
   ```html
   <script src="https://app.sandbox.midtrans.com/snap/snap.js" 
           data-client-key="YOUR_CLIENT_KEY"></script>
   ```
2. Check browser console untuk error
3. Gunakan redirect URL alternative:
   ```typescript
   window.location.href = payment.redirectUrl;
   ```

## Security Best Practices

1. ✅ **Never expose Server Key** di frontend
2. ✅ **Always verify webhook signature** sebelum process payment
3. ✅ **Use HTTPS** untuk production
4. ✅ **Validate amount** di backend (jangan trust frontend)
5. ✅ **Log all transactions** untuk audit trail
6. ✅ **Set proper CORS** untuk API endpoints

## Production Checklist

Before going live:

- [ ] Change `MIDTRANS_IS_PRODUCTION=true`
- [ ] Use production Server Key & Client Key
- [ ] Update Notification URL to production domain
- [ ] Enable 3D Secure for credit card
- [ ] Setup proper error logging (Sentry, etc)
- [ ] Test all payment methods
- [ ] Setup monitoring for failed webhooks
- [ ] Configure payment retry logic
- [ ] Add customer email notification
- [ ] Setup refund handling process

## References

- [Midtrans Documentation](https://docs.midtrans.com)
- [Snap API Documentation](https://docs.midtrans.com/en/snap/overview)
- [HTTP Notification/Webhooks](https://docs.midtrans.com/en/after-payment/http-notification)
- [Testing Payment](https://docs.midtrans.com/en/technical-reference/sandbox-test)

## Support

For issues related to Midtrans integration:
- Midtrans Support: support@midtrans.com
- Midtrans Dashboard: https://dashboard.midtrans.com
- Midtrans Slack: https://midtrans.slack.com
