# Fix: PaymentTransaction.user must be a "StorifyUser" instance

## Problem

```
Cannot assign "<MUser: admin@gmail.com>": "PaymentTransaction.user" must be a "StorifyUser" instance.
```

**Root Cause**: Saat create payment, Django view menggunakan `request.user` (admin `MUser` yang login via JWT) sebagai `PaymentTransaction.user`. Tapi field `user` di model `PaymentTransaction`, `Subscription`, dan `ListeningHistory` seharusnya menggunakan `StorifyUser` — bukan Django User/MUser.

Storify (Node.js) mengirim data user Storify di **request body**, bukan di `request.user`. `request.user` hanya admin Pewaca yang login via JWT untuk autentikasi API.

---

## Data yang Dikirim dari Storify (Node.js)

### POST `/api/storify-subscription/payment/create/`

```json
{
  "plan_id": 2,
  "user_email": "user@example.com",
  "user_name": "John Doe",
  "storify_user_id": "123"
}
```

### GET `/api/storify-subscription/active/`

```
?storify_user_id=123
```

### GET `/api/storify-subscription/listening/status/`

```
?visitor_id=xxx
```

### POST `/api/storify-subscription/listening/record/`

```json
{
  "book_id": 5,
  "visitor_id": "uuid-guest"
}
```

---

## Step 1: Buat Model `StorifyUser`

Tambahkan model baru di `models.py`:

```python
class StorifyUser(models.Model):
    """
    User dari aplikasi Storify (Node.js).
    Terpisah dari Django User/MUser.
    Dibuat otomatis saat pertama kali create payment.
    """
    storify_user_id = models.CharField(max_length=100, unique=True, db_index=True)
    email = models.EmailField(blank=True)
    name = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'storify_users'

    def __str__(self):
        return f"StorifyUser({self.storify_user_id}: {self.email})"
```

---

## Step 2: Update Model ForeignKey References

Ubah semua `ForeignKey(User, ...)` menjadi `ForeignKey(StorifyUser, ...)`:

### PaymentTransaction

```python
class PaymentTransaction(models.Model):
    # SEBELUM (SALAH):
    # user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payment_transactions')

    # SESUDAH (BENAR):
    user = models.ForeignKey(StorifyUser, on_delete=models.CASCADE, related_name='payment_transactions')
    # ... rest tetap sama
```

### Subscription

```python
class Subscription(models.Model):
    # SEBELUM (SALAH):
    # user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')

    # SESUDAH (BENAR):
    user = models.ForeignKey(StorifyUser, on_delete=models.CASCADE, related_name='subscriptions')
    # ... rest tetap sama
```

### ListeningHistory

```python
class ListeningHistory(models.Model):
    # SEBELUM (SALAH):
    # user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='listening_history')

    # SESUDAH (BENAR):
    user = models.ForeignKey(StorifyUser, on_delete=models.CASCADE, null=True, blank=True, related_name='listening_history')
    # ... rest tetap sama
```

---

## Step 3: Update Views

### `create_payment` — Paling Penting

```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment(request):
    """
    POST /api/storify-subscription/payment/create/
    Body: {
        "plan_id": 1,
        "user_email": "user@example.com",
        "user_name": "John Doe",
        "storify_user_id": "123"
    }
    """
    plan_id = request.data.get('plan_id')
    storify_user_id = request.data.get('storify_user_id')
    user_email = request.data.get('user_email', '')
    user_name = request.data.get('user_name', '')

    if not plan_id:
        return Response({'message': 'plan_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    if not storify_user_id:
        return Response({'message': 'storify_user_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
    except SubscriptionPlan.DoesNotExist:
        return Response({'message': 'Invalid plan_id'}, status=status.HTTP_404_NOT_FOUND)

    # ✅ Get or create StorifyUser dari request body (BUKAN request.user!)
    storify_user, created = StorifyUser.objects.get_or_create(
        storify_user_id=storify_user_id,
        defaults={
            'email': user_email,
            'name': user_name,
        }
    )

    # Update email/name jika berubah
    if not created:
        updated = False
        if user_email and storify_user.email != user_email:
            storify_user.email = user_email
            updated = True
        if user_name and storify_user.name != user_name:
            storify_user.name = user_name
            updated = True
        if updated:
            storify_user.save()

    # Create payment transaction
    pewaca = PewacaAPIService()

    try:
        invoice_data = pewaca.create_invoice(
            amount=plan.price,
            customer_name=user_name or storify_user.name,
            customer_email=user_email or storify_user.email,
            description=f"Storify Premium - {plan.name}"
        )

        transaction = PaymentTransaction.objects.create(
            user=storify_user,  # ✅ StorifyUser, bukan request.user
            plan=plan,
            amount=plan.price,
            status='pending',
            qris_content=invoice_data['qris_content'],
            qris_invoice_id=invoice_data['qris_invoice_id'],
            transaction_number=invoice_data['transaction_number'],
            expired_at=invoice_data['expired_at']
        )

        serializer = PaymentTransactionSerializer(transaction)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

### `get_active_subscription`

```python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_active_subscription(request):
    """
    GET /api/storify-subscription/active/?storify_user_id=123
    """
    storify_user_id = request.query_params.get('storify_user_id')

    if not storify_user_id:
        return Response(None)

    try:
        storify_user = StorifyUser.objects.get(storify_user_id=storify_user_id)
    except StorifyUser.DoesNotExist:
        return Response(None)

    subscription = SubscriptionService.get_active_subscription(storify_user)

    if subscription:
        serializer = SubscriptionSerializer(subscription)
        return Response(serializer.data)

    return Response(None)
```

### `get_payment_status` — Update webhook payment handler

Di view `get_payment_status` dan `update_payment_status`, transaction sudah punya `user` = `StorifyUser`, 
jadi `SubscriptionService.create_subscription(transaction.user, ...)` sudah benar selama `Subscription.user` juga pakai `StorifyUser`.

```python
# Di get_payment_status, saat payment confirmed:
if payment_status['status'] == 'paid':
    transaction.paid_at = timezone.now()
    transaction.payment_customer_name = payment_status['payment_customer_name']
    transaction.payment_method_by = payment_status['payment_method']

    # ✅ transaction.user sudah StorifyUser
    SubscriptionService.create_subscription(
        transaction.user,  # StorifyUser instance
        transaction.plan,
        transaction
    )
```

### `get_listening_status` dan `record_listening`

Untuk listening, bisa tetap pakai `visitor_id` untuk guest. Jika perlu lookup by `storify_user_id`:

```python
@api_view(['GET'])
@permission_classes([AllowAny])
def get_listening_status(request):
    """
    GET /api/storify-subscription/listening/status/?visitor_id=xxx&storify_user_id=yyy
    """
    visitor_id = request.query_params.get('visitor_id')
    storify_user_id = request.query_params.get('storify_user_id')

    storify_user = None
    if storify_user_id:
        try:
            storify_user = StorifyUser.objects.get(storify_user_id=storify_user_id)
        except StorifyUser.DoesNotExist:
            pass

    status_data = ListeningLimitService.check_listening_status(storify_user, visitor_id)
    serializer = ListeningStatusSerializer(status_data)
    return Response(serializer.data)
```

---

## Step 4: Update Services

### `SubscriptionService.get_active_subscription`

```python
@staticmethod
def get_active_subscription(storify_user):
    """Ambil subscription aktif StorifyUser"""
    try:
        subscription = Subscription.objects.filter(
            user=storify_user,  # ✅ StorifyUser
            status='active',
            end_date__gt=timezone.now()
        ).select_related('plan').latest('end_date')
        return subscription
    except Subscription.DoesNotExist:
        return None
```

### `ListeningLimitService.check_listening_status`

Ubah parameter dari `user` (Django User) ke `storify_user` (StorifyUser):

```python
@staticmethod
def check_listening_status(storify_user=None, visitor_id=None):
    # Cek subscription jika storify_user ada
    if storify_user:
        active_subscription = SubscriptionService.get_active_subscription(storify_user)

        if active_subscription:
            return {
                'can_listen': True,
                'listen_count': 0,
                'limit': None,
                'has_subscription': True,
                'subscription_ends_at': active_subscription.end_date,
                'reason': None
            }

        # Free user (ada StorifyUser tapi tanpa subscription)
        listen_count = ListeningHistory.objects.filter(user=storify_user).count()
        can_listen = listen_count < FREE_USER_LISTEN_LIMIT

        return {
            'can_listen': can_listen,
            'listen_count': listen_count,
            'limit': FREE_USER_LISTEN_LIMIT,
            'has_subscription': False,
            'subscription_ends_at': None,
            'reason': f'Anda sudah mendengarkan {listen_count} dari {FREE_USER_LISTEN_LIMIT} buku gratis.' if not can_listen else None
        }

    # Guest user (visitor_id only)
    if visitor_id:
        listen_count = ListeningHistory.objects.filter(visitor_id=visitor_id).count()
        can_listen = listen_count < GUEST_LISTEN_LIMIT

        return {
            'can_listen': can_listen,
            'listen_count': listen_count,
            'limit': GUEST_LISTEN_LIMIT,
            'has_subscription': False,
            'subscription_ends_at': None,
            'reason': f'Anda sudah mendengarkan {listen_count} buku sebagai guest.' if not can_listen else None
        }

    return {
        'can_listen': False,
        'listen_count': 0,
        'limit': 0,
        'has_subscription': False,
        'subscription_ends_at': None,
        'reason': 'Silakan login untuk mulai mendengarkan.'
    }
```

---

## Step 5: Migrasi Database

```bash
cd /var/www/pewaca_be/dash
source ../venv/bin/activate

# Generate migration
python manage.py makemigrations storify_subscription

# Apply migration ke storify_db
python manage.py migrate storify_subscription --database=storify_db
```

> **Catatan**: Karena mengubah ForeignKey dari `User` → `StorifyUser`, jika sudah ada data di tabel `payment_transactions` / `subscriptions`, perlu handle migrasi data juga. Jika belum ada data (belum ada payment berhasil), bisa langsung drop & recreate:
> 
> ```bash
> python manage.py dbshell --database=storify_db
> ```
> ```sql
> -- Cek apakah ada data
> SELECT COUNT(*) FROM payment_transactions;
> SELECT COUNT(*) FROM subscriptions;
> 
> -- Jika kosong, bisa truncate dan re-migrate
> DROP TABLE IF EXISTS payment_transactions CASCADE;
> DROP TABLE IF EXISTS subscriptions CASCADE;
> DROP TABLE IF EXISTS listening_history CASCADE;
> DELETE FROM django_migrations WHERE app = 'storify_subscription';
> ```
> Lalu jalankan ulang:
> ```bash
> python manage.py makemigrations storify_subscription
> python manage.py migrate storify_subscription --database=storify_db
> ```

---

## Step 6: Restart Service

```bash
sudo systemctl restart gunicorn
# atau
sudo systemctl restart pewaca
```

---

## Step 7: Verifikasi

```bash
# Login untuk dapat token
TOKEN=$(curl -s https://admin-v2.pewaca.id/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"Sobat3"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

# Test create payment (harus berhasil, bukan error MUser)
curl -s -X POST https://admin-v2.pewaca.id/api/storify-subscription/payment/create/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": 2,
    "user_email": "test@storify.asia",
    "user_name": "Test User",
    "storify_user_id": "42"
  }' | python3 -m json.tool
```

Expected: Return QRIS transaction data dengan `status: "pending"`, **bukan** error `MUser`.

---

## Ringkasan Perubahan

| File | Perubahan |
|------|-----------|
| `models.py` | Tambah model `StorifyUser`; ubah ForeignKey di `PaymentTransaction`, `Subscription`, `ListeningHistory` dari `User` → `StorifyUser` |
| `views.py` | `create_payment`: gunakan `storify_user_id` dari body untuk `get_or_create(StorifyUser)` bukan `request.user`; `get_active_subscription`: lookup by `storify_user_id` query param |
| `services.py` | Update parameter dari `User` → `StorifyUser` |
| Database | Migration: buat tabel `storify_users`, alter ForeignKey columns |

### Konsep Kunci

```
request.user = Admin Pewaca (MUser) → hanya untuk autentikasi API  
request.data['storify_user_id'] = User Storify → untuk PaymentTransaction, Subscription, dll
```
