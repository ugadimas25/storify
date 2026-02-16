# Setup Database `storify_db` untuk Django Storify Subscription

## Problem

Error saat deployment:
```
django.utils.connection.ConnectionDoesNotExist: The connection 'storify_db' doesn't exist.
```

Semua endpoint `/api/storify-subscription/*` return **500 Internal Server Error** karena database `storify_db` belum dikonfigurasi.

---

## Langkah 1: Buat Database PostgreSQL

SSH ke server:
```bash
ssh root@43.157.248.119
```

Buat database baru di PostgreSQL:
```bash
sudo -u postgres psql
```

```sql
-- Buat database
CREATE DATABASE storify_subscription_db;

-- Buat user (jika belum ada, atau pakai user existing)
-- CREATE USER storify_user WITH PASSWORD 'password_aman';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE storify_subscription_db TO storify_user;

-- Connect ke database dan set permissions
\c storify_subscription_db
GRANT ALL ON SCHEMA public TO storify_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO storify_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO storify_user;

\q
```

---

## Langkah 2: Tambahkan Koneksi Database di Django Settings

Edit file settings Django. Bisa di `settings.py` atau `config/config.production.yml` tergantung konfigurasi project.

```bash
cd /var/www/pewaca_be/dash
nano settings.py  # atau file settings yang dipakai
```

### Tambahkan `storify_db` di `DATABASES`:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',  # atau postgresql, sesuai existing
        'NAME': '...',       # existing default DB
        'USER': '...',
        'PASSWORD': '...',
        'HOST': 'localhost',
        'PORT': '...',
    },
    'storify_db': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'storify_subscription_db',
        'USER': 'storify_user',
        'PASSWORD': 'PASSWORD_ANDA',
        'HOST': 'localhost',
        'PORT': '5432',
    },
}
```

### Jika pakai `config.yml` / environment variable:

```yaml
# config/config.production.yml
databases:
  storify_db:
    engine: django.db.backends.postgresql
    name: storify_subscription_db
    user: storify_user
    password: PASSWORD_ANDA
    host: localhost
    port: 5432
```

Atau via `.env`:
```env
STORIFY_DB_NAME=storify_subscription_db
STORIFY_DB_USER=storify_user
STORIFY_DB_PASSWORD=PASSWORD_ANDA
STORIFY_DB_HOST=localhost
STORIFY_DB_PORT=5432
```

Lalu di `settings.py`:
```python
DATABASES['storify_db'] = {
    'ENGINE': 'django.db.backends.postgresql',
    'NAME': env('STORIFY_DB_NAME', default='storify_subscription_db'),
    'USER': env('STORIFY_DB_USER', default='storify_user'),
    'PASSWORD': env('STORIFY_DB_PASSWORD'),
    'HOST': env('STORIFY_DB_HOST', default='localhost'),
    'PORT': env('STORIFY_DB_PORT', default='5432'),
}
```

---

## Langkah 3: Tambahkan Database Router

Buat file `storify_subscription/db_router.py`:

```python
class StorifySubscriptionRouter:
    """
    Database router untuk mengarahkan storify_subscription app ke storify_db.
    """
    app_label = 'storify_subscription'

    def db_for_read(self, model, **hints):
        if model._meta.app_label == self.app_label:
            return 'storify_db'
        return None

    def db_for_write(self, model, **hints):
        if model._meta.app_label == self.app_label:
            return 'storify_db'
        return None

    def allow_relation(self, obj1, obj2, **hints):
        if (
            obj1._meta.app_label == self.app_label or
            obj2._meta.app_label == self.app_label
        ):
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if app_label == self.app_label:
            return db == 'storify_db'
        if db == 'storify_db':
            return False
        return None
```

Daftarkan router di `settings.py`:

```python
DATABASE_ROUTERS = ['storify_subscription.db_router.StorifySubscriptionRouter']
```

> **Catatan**: Jika sudah ada `DATABASE_ROUTERS`, tambahkan ke list yang sudah ada:
> ```python
> DATABASE_ROUTERS = [
>     '...',  # existing routers
>     'storify_subscription.db_router.StorifySubscriptionRouter',
> ]
> ```

---

## Langkah 4: Jalankan Migrasi

```bash
cd /var/www/pewaca_be/dash
source ../venv/bin/activate

# Generate migration files (jika belum ada)
python manage.py makemigrations storify_subscription

# Jalankan migrasi ke storify_db
python manage.py migrate storify_subscription --database=storify_db

# Verifikasi tabel sudah terbuat
python manage.py dbshell --database=storify_db
```

Di PostgreSQL shell, cek:
```sql
\dt
```

Harus muncul tabel:
- `subscription_plans`
- `subscriptions`
- `listening_history`
- `payment_transactions`
- `django_migrations`

---

## Langkah 5: Seed Data Subscription Plans

```bash
python manage.py shell
```

```python
from storify_subscription.models import SubscriptionPlan

plans = [
    {
        'name': 'Mingguan',
        'price': 15000,
        'duration_days': 7,
        'description': 'Akses unlimited selama 1 minggu',
    },
    {
        'name': 'Bulanan',
        'price': 49000,
        'duration_days': 30,
        'description': 'Akses unlimited selama 1 bulan - BEST VALUE',
    },
    {
        'name': 'Tahunan',
        'price': 399000,
        'duration_days': 365,
        'description': 'Akses unlimited selama 1 tahun',
    },
]

for plan_data in plans:
    obj, created = SubscriptionPlan.objects.using('storify_db').get_or_create(**plan_data)
    status = "CREATED" if created else "EXISTS"
    print(f"  {status}: {obj.name} - Rp {obj.price:,.0f}")
```

---

## Langkah 6: Restart Services

```bash
# Restart Django/Gunicorn
sudo systemctl restart gunicorn
# atau
sudo systemctl restart pewaca

# Restart Nginx (jika perlu)
sudo systemctl restart nginx
```

---

## Langkah 7: Verifikasi

Test semua endpoint:

```bash
# 1. Login untuk dapat token
TOKEN=$(curl -s https://admin-v2.pewaca.id/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"pengurus1@gmail.com","password":"Sobat3"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

echo "Token: $TOKEN"

# 2. Test Plans (harus return array 3 plans)
curl -s https://admin-v2.pewaca.id/api/storify-subscription/plans/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | python3 -m json.tool

# 3. Test Listening Status
curl -s "https://admin-v2.pewaca.id/api/storify-subscription/listening/status/?visitor_id=test-123" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | python3 -m json.tool

# 4. Test Active Subscription
curl -s https://admin-v2.pewaca.id/api/storify-subscription/active/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | python3 -m json.tool

# 5. Test Create Payment (QRIS)
curl -s -X POST https://admin-v2.pewaca.id/api/storify-subscription/payment/create/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan_id": 2}' | python3 -m json.tool
```

### Expected Results:
| Endpoint | Expected |
|----------|----------|
| `/plans/` | `[{"id":1,"name":"Mingguan",...}, {"id":2,"name":"Bulanan",...}, {"id":3,"name":"Tahunan",...}]` |
| `/listening/status/` | `{"can_listen": true, "listen_count": 0, ...}` |
| `/active/` | `null` (jika belum ada subscription) |
| `/payment/create/` | `{"id": "uuid...", "qris_content": "000201...", "status": "pending", ...}` |

---

## Langkah 8: Fix CI/CD Pipeline

Update CI/CD script agar tidak gagal lagi. Pastikan migration command benar:

```yaml
# .gitlab-ci.yml atau deploy script
- ssh $DEPLOY_USER@$DEPLOY_HOST "cd $DEPLOY_PATH/dash && source ../venv/bin/activate && python manage.py migrate storify_subscription --database=storify_db --noinput"
```

---

## Troubleshooting

### Error: `The connection 'storify_db' doesn't exist`
- **Penyebab**: `DATABASES['storify_db']` belum ditambahkan di settings
- **Fix**: Ikuti Langkah 2

### Error: `FATAL: database "storify_subscription_db" does not exist`
- **Penyebab**: Database PostgreSQL belum dibuat
- **Fix**: Ikuti Langkah 1

### Error: `FATAL: role "storify_user" does not exist`
- **Penyebab**: PostgreSQL user belum dibuat
- **Fix**: `sudo -u postgres createuser -P storify_user`

### Error: `No module named 'storify_subscription'`
- **Penyebab**: App belum terdaftar di `INSTALLED_APPS`
- **Fix**: Tambahkan `'storify_subscription'` di `INSTALLED_APPS` pada settings.py

### Error: 500 pada semua endpoint tapi login works
- **Penyebab**: Biasanya database storify_db tidak bisa diakses
- **Fix**: Cek koneksi PostgreSQL:
  ```bash
  psql -h localhost -U storify_user -d storify_subscription_db
  ```

---

## Ringkasan Perubahan yang Diperlukan

| File | Perubahan |
|------|-----------|
| `settings.py` | Tambah `DATABASES['storify_db']` + `DATABASE_ROUTERS` |
| `storify_subscription/db_router.py` | Buat file baru (database router) |
| `.env` / `config.yml` | Tambah credentials DB storify |
| PostgreSQL | Buat database `storify_subscription_db` |
| Migration | `python manage.py migrate storify_subscription --database=storify_db` |
| Seed data | Insert 3 subscription plans |
