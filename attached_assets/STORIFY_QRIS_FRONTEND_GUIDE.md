# Storify Audiobook - QRIS Subscription Frontend Implementation Guide

## Overview

Dokumentasi ini menjelaskan cara mengintegrasikan sistem subscription QRIS Storify dari sisi frontend.

**Base URL**: `https://admin-v2.pewaca.id/api/storify-subscription/`

---

## Flow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User      │     │  Frontend   │     │   Backend   │     │  QRIS API   │
│  (Mobile)   │     │   (App)     │     │  (Django)   │     │ (Interactive)│
└─────┬───────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
      │                    │                   │                   │
      │  1. Pilih Plan     │                   │                   │
      │───────────────────>│                   │                   │
      │                    │                   │                   │
      │                    │  2. POST /payment/create              │
      │                    │──────────────────>│                   │
      │                    │                   │                   │
      │                    │                   │  3. Create Invoice │
      │                    │                   │──────────────────>│
      │                    │                   │                   │
      │                    │                   │<──────────────────│
      │                    │                   │   QR Content      │
      │                    │<──────────────────│                   │
      │                    │   Transaction +   │                   │
      │                    │   QRIS Content    │                   │
      │  4. Show QR Code   │                   │                   │
      │<───────────────────│                   │                   │
      │                    │                   │                   │
      │  5. Scan & Pay     │                   │                   │
      │  (via e-wallet)    │                   │                   │
      │                    │                   │                   │
      │                    │  6. Poll status (every 3s)            │
      │                    │──────────────────>│                   │
      │                    │<──────────────────│                   │
      │                    │   status: paid    │                   │
      │                    │                   │                   │
      │  7. Success!       │                   │                   │
      │<───────────────────│                   │                   │
      │  Subscription      │                   │                   │
      │  Active            │                   │                   │
      │                    │                   │                   │
```

---

## API Endpoints

### 1. Get Subscription Plans

Ambil daftar paket langganan yang tersedia.

```
GET /api/storify-subscription/plans/
```

**Headers:**
```
Content-Type: application/json
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Mingguan",
    "price": 15000,
    "duration_days": 7,
    "description": "Akses unlimited selama 1 minggu",
    "is_active": true
  },
  {
    "id": 2,
    "name": "Bulanan",
    "price": 49000,
    "duration_days": 30,
    "description": "Akses unlimited selama 1 bulan - BEST VALUE",
    "is_active": true
  },
  {
    "id": 3,
    "name": "Tahunan",
    "price": 399000,
    "duration_days": 365,
    "description": "Akses unlimited selama 1 tahun",
    "is_active": true
  }
]
```

---

### 2. Check Listening Status

Cek apakah user/guest masih bisa mendengarkan audiobook (limit enforcement).

```
GET /api/storify-subscription/listening/status/?visitor_id={visitor_id}
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `visitor_id` | string | No | UUID untuk guest user (jika tidak login) |

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}  # Optional - untuk user login
```

**Response (200 OK) - Guest User:**
```json
{
  "can_listen": true,
  "listen_count": 0,
  "limit": 1,
  "has_subscription": false,
  "subscription_ends_at": null,
  "reason": null
}
```

**Response (200 OK) - Free User (logged in, no subscription):**
```json
{
  "can_listen": true,
  "listen_count": 2,
  "limit": 3,
  "has_subscription": false,
  "subscription_ends_at": null,
  "reason": null
}
```

**Response (200 OK) - Subscribed User:**
```json
{
  "can_listen": true,
  "listen_count": 0,
  "limit": null,
  "has_subscription": true,
  "subscription_ends_at": "2026-03-15T10:30:00Z",
  "reason": null
}
```

**Response (200 OK) - Limit Reached:**
```json
{
  "can_listen": false,
  "listen_count": 3,
  "limit": 3,
  "has_subscription": false,
  "subscription_ends_at": null,
  "reason": "Anda sudah mendengarkan 3 dari 3 buku gratis. Silakan berlangganan untuk akses unlimited."
}
```

**Listening Limits:**
| User Type | Limit |
|-----------|-------|
| Guest (tidak login) | 1 buku |
| Free User (login, no subscription) | 3 buku |
| Subscriber | Unlimited |

---

### 3. Record Listening

Record bahwa user mulai mendengarkan buku. Panggil ini saat user mulai play audiobook.

```
POST /api/storify-subscription/listening/record/
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}  # Optional - untuk user login
```

**Request Body:**
```json
{
  "book_id": 123,
  "visitor_id": "550e8400-e29b-41d4-a716-446655440000"  // Optional - untuk guest
}
```

**Response (200 OK) - Success:**
```json
{
  "message": "Listening recorded",
  "already_recorded": false
}
```

**Response (200 OK) - Already Listened (replay allowed):**
```json
{
  "message": "Continue listening",
  "already_recorded": true
}
```

**Response (403 Forbidden) - Limit Reached:**
```json
{
  "message": "Anda sudah mendengarkan 3 dari 3 buku gratis. Silakan berlangganan untuk akses unlimited."
}
```

---

### 4. Get Active Subscription

Ambil subscription aktif user. **Requires Authentication.**

```
GET /api/storify-subscription/active/
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Response (200 OK) - Has Active Subscription:**
```json
{
  "id": 1,
  "plan": {
    "id": 2,
    "name": "Bulanan",
    "price": 49000,
    "duration_days": 30,
    "description": "Akses unlimited selama 1 bulan - BEST VALUE",
    "is_active": true
  },
  "start_date": "2026-02-14T10:30:00Z",
  "end_date": "2026-03-16T10:30:00Z",
  "status": "active",
  "created_at": "2026-02-14T10:30:00Z"
}
```

**Response (200 OK) - No Active Subscription:**
```json
null
```

---

### 5. Create Payment (Generate QRIS)

Buat transaksi pembayaran dan generate QR Code QRIS. **Requires Authentication.**

```
POST /api/storify-subscription/payment/create/
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "plan_id": 2
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "plan": {
    "id": 2,
    "name": "Bulanan",
    "price": 49000,
    "duration_days": 30,
    "description": "Akses unlimited selama 1 bulan",
    "is_active": true
  },
  "amount": 49000,
  "status": "pending",
  "qris_content": "00020101021226670016COM.NOBUBANK.WWW01teleponpulsa....(QR code data)",
  "qris_invoice_id": "INV-20260214-ABC123",
  "transaction_number": "STORIFY-20260214103000-A1B2C3",
  "expired_at": "2026-02-14T11:00:00Z",
  "paid_at": null,
  "payment_customer_name": "",
  "payment_method_by": "",
  "created_at": "2026-02-14T10:30:00Z"
}
```

**Error Response (400):**
```json
{
  "message": "plan_id is required"
}
```

**Error Response (404):**
```json
{
  "message": "Invalid plan_id"
}
```

---

### 6. Check Payment Status (Polling)

Cek status pembayaran. Gunakan untuk polling setelah user scan QR.

```
GET /api/storify-subscription/payment/{transaction_id}/
```

**Headers:**
```
Content-Type: application/json
```

**Response (200 OK) - Pending:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "plan": {
    "id": 2,
    "name": "Bulanan",
    "price": 49000,
    "duration_days": 30,
    "description": "Akses unlimited selama 1 bulan",
    "is_active": true
  },
  "amount": 49000,
  "status": "pending",
  "qris_content": "00020101021226670016...",
  "qris_invoice_id": "INV-20260214-ABC123",
  "transaction_number": "STORIFY-20260214103000-A1B2C3",
  "expired_at": "2026-02-14T11:00:00Z",
  "paid_at": null,
  "payment_customer_name": "",
  "payment_method_by": "",
  "created_at": "2026-02-14T10:30:00Z"
}
```

**Response (200 OK) - Paid:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "plan": {
    "id": 2,
    "name": "Bulanan",
    "price": 49000,
    "duration_days": 30,
    "description": "Akses unlimited selama 1 bulan",
    "is_active": true
  },
  "amount": 49000,
  "status": "paid",
  "qris_content": "00020101021226670016...",
  "qris_invoice_id": "INV-20260214-ABC123",
  "transaction_number": "STORIFY-20260214103000-A1B2C3",
  "expired_at": "2026-02-14T11:00:00Z",
  "paid_at": "2026-02-14T10:35:00Z",
  "payment_customer_name": "JOHN DOE",
  "payment_method_by": "GoPay",
  "created_at": "2026-02-14T10:30:00Z"
}
```

**Status Values:**
| Status | Description |
|--------|-------------|
| `pending` | Menunggu pembayaran |
| `paid` | Pembayaran berhasil, subscription aktif |
| `expired` | QR Code expired (30 menit) |
| `failed` | Pembayaran gagal |

---

### 7. Get Payment History

Ambil history transaksi pembayaran user. **Requires Authentication.**

```
GET /api/storify-subscription/payment/history/
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "plan": {
      "id": 2,
      "name": "Bulanan",
      "price": 49000,
      "duration_days": 30,
      "description": "Akses unlimited selama 1 bulan",
      "is_active": true
    },
    "amount": 49000,
    "status": "paid",
    "paid_at": "2026-02-14T10:35:00Z",
    "payment_method_by": "GoPay",
    "created_at": "2026-02-14T10:30:00Z"
  }
]
```

---

### 8. Get Subscription History

Ambil history subscription user. **Requires Authentication.**

```
GET /api/storify-subscription/history/
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "plan": {
      "id": 2,
      "name": "Bulanan",
      "price": 49000,
      "duration_days": 30,
      "description": "Akses unlimited selama 1 bulan",
      "is_active": true
    },
    "start_date": "2026-02-14T10:35:00Z",
    "end_date": "2026-03-16T10:35:00Z",
    "status": "active",
    "created_at": "2026-02-14T10:35:00Z"
  }
]
```

---

## Frontend Implementation Examples

### React Native / Flutter - Payment Flow

```javascript
// 1. Get Plans
const getPlans = async () => {
  const response = await fetch('https://admin-v2.pewaca.id/api/storify-subscription/plans/');
  return await response.json();
};

// 2. Create Payment
const createPayment = async (planId, token) => {
  const response = await fetch('https://admin-v2.pewaca.id/api/storify-subscription/payment/create/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ plan_id: planId })
  });
  return await response.json();
};

// 3. Show QR Code
const showQRCode = (qrisContent) => {
  // Use QR code library to display qris_content
  // Example: react-native-qrcode-svg, qr_flutter
  return <QRCode value={qrisContent} size={250} />;
};

// 4. Poll Payment Status
const pollPaymentStatus = async (transactionId, onSuccess, onExpired) => {
  const maxAttempts = 60; // 30 minutes / 30 seconds per attempt
  let attempts = 0;
  
  const poll = async () => {
    if (attempts >= maxAttempts) {
      onExpired();
      return;
    }
    
    const response = await fetch(
      `https://admin-v2.pewaca.id/api/storify-subscription/payment/${transactionId}/`
    );
    const data = await response.json();
    
    if (data.status === 'paid') {
      onSuccess(data);
      return;
    }
    
    if (data.status === 'expired' || data.status === 'failed') {
      onExpired();
      return;
    }
    
    // Still pending, poll again in 3 seconds
    attempts++;
    setTimeout(poll, 3000);
  };
  
  poll();
};
```

### Complete Payment Screen Example

```javascript
const PaymentScreen = ({ planId }) => {
  const [transaction, setTransaction] = useState(null);
  const [status, setStatus] = useState('loading');
  const { token } = useAuth();

  useEffect(() => {
    // Create payment on mount
    const initPayment = async () => {
      try {
        const data = await createPayment(planId, token);
        setTransaction(data);
        setStatus('pending');
        
        // Start polling
        pollPaymentStatus(
          data.id,
          (result) => {
            setStatus('success');
            // Navigate to success screen or refresh subscription status
          },
          () => {
            setStatus('expired');
          }
        );
      } catch (error) {
        setStatus('error');
      }
    };
    
    initPayment();
  }, [planId]);

  if (status === 'loading') return <LoadingSpinner />;
  if (status === 'error') return <ErrorScreen />;
  if (status === 'expired') return <ExpiredScreen onRetry={() => initPayment()} />;
  if (status === 'success') return <SuccessScreen />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan QR Code untuk Bayar</Text>
      <Text style={styles.amount}>Rp {transaction.amount.toLocaleString()}</Text>
      
      <View style={styles.qrContainer}>
        <QRCode value={transaction.qris_content} size={250} />
      </View>
      
      <Text style={styles.instruction}>
        Buka aplikasi e-wallet (GoPay, OVO, DANA, dll) dan scan QR di atas
      </Text>
      
      <Text style={styles.timer}>
        QR berlaku sampai: {formatTime(transaction.expired_at)}
      </Text>
      
      <Text style={styles.hint}>
        Pembayaran akan terdeteksi otomatis
      </Text>
    </View>
  );
};
```

### Listening Limit Check Example

```javascript
const AudioPlayerScreen = ({ book }) => {
  const [canPlay, setCanPlay] = useState(false);
  const [status, setStatus] = useState(null);
  const { user, token } = useAuth();
  const visitorId = useVisitorId(); // UUID stored in device

  useEffect(() => {
    checkListeningStatus();
  }, []);

  const checkListeningStatus = async () => {
    const url = user 
      ? 'https://admin-v2.pewaca.id/api/storify-subscription/listening/status/'
      : `https://admin-v2.pewaca.id/api/storify-subscription/listening/status/?visitor_id=${visitorId}`;
    
    const headers = user 
      ? { 'Authorization': `Bearer ${token}` }
      : {};
    
    const response = await fetch(url, { headers });
    const data = await response.json();
    setStatus(data);
    setCanPlay(data.can_listen);
  };

  const onPlayPress = async () => {
    if (!status.can_listen) {
      // Show subscription prompt
      showSubscriptionModal();
      return;
    }
    
    // Record listening
    const response = await fetch('https://admin-v2.pewaca.id/api/storify-subscription/listening/record/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(user ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        book_id: book.id,
        visitor_id: user ? undefined : visitorId
      })
    });
    
    if (response.status === 403) {
      // Limit reached
      showSubscriptionModal();
      return;
    }
    
    // Start playing
    playAudio();
  };

  return (
    <View>
      <BookCover book={book} />
      
      {status?.has_subscription ? (
        <Badge text="Premium" color="gold" />
      ) : (
        <Text>
          {status?.listen_count}/{status?.limit} buku gratis
        </Text>
      )}
      
      <PlayButton onPress={onPlayPress} disabled={!canPlay} />
      
      {!canPlay && (
        <UpgradeButton onPress={() => navigate('Subscription')} />
      )}
    </View>
  );
};
```

---

## Error Handling

| HTTP Code | Description | Action |
|-----------|-------------|--------|
| 400 | Bad Request | Cek request body |
| 401 | Unauthorized | Redirect ke login |
| 403 | Forbidden | Tampilkan pesan limit / upgrade prompt |
| 404 | Not Found | Resource tidak ditemukan |
| 500 | Internal Server Error | Tampilkan error message, retry |

---

## Important Notes

1. **QR Code Expiry**: QR Code expired setelah **30 menit**
2. **Polling Interval**: Gunakan interval **3 detik** untuk polling status
3. **Visitor ID**: Untuk guest user, generate UUID dan simpan di device storage
4. **Transaction Prefix**: Semua transaksi Storify memiliki prefix `STORIFY-`
5. **Webhook**: Pembayaran diproses via webhook ke `https://admin-v2.pewaca.id/api/qris/webhook/`

---

## Testing

### Test dengan cURL

```bash
# 1. Get Plans
curl https://admin-v2.pewaca.id/api/storify-subscription/plans/

# 2. Check Listening Status (Guest)
curl "https://admin-v2.pewaca.id/api/storify-subscription/listening/status/?visitor_id=test-guest-123"

# 3. Create Payment (requires token)
curl -X POST https://admin-v2.pewaca.id/api/storify-subscription/payment/create/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"plan_id": 2}'

# 4. Check Payment Status
curl https://admin-v2.pewaca.id/api/storify-subscription/payment/TRANSACTION_UUID/

# 5. Simulate Payment Success (for testing only)
curl -X POST https://admin-v2.pewaca.id/api/storify-subscription/payment/TRANSACTION_UUID/update/ \
  -H "Content-Type: application/json" \
  -d '{"status": "paid", "payment_customer_name": "Test User", "payment_method_by": "GoPay"}'
```

---

## Contact

Untuk pertanyaan teknis, hubungi backend team.
