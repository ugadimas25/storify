# Storify Audiobook - Django Backend Implementation Guide
## Xendit Subscription Payment System

**Tag Prefix**: `/api/storify-subscription/` (berbeda dari endpoint payment lainnya)

---

## 1. Models Django

```python
# models.py
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid

class SubscriptionPlan(models.Model):
    """Paket langganan audiobook"""
    name = models.CharField(max_length=100)  # Mingguan, Bulanan, Tahunan
    price = models.DecimalField(max_digits=10, decimal_places=0)  # Harga dalam Rupiah
    duration_days = models.IntegerField()  # 7, 30, 365
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'subscription_plans'
    
    def __str__(self):
        return f"{self.name} - Rp {self.price:,.0f}"


class Subscription(models.Model):
    """Langganan user aktif"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.CASCADE)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    payment_transaction = models.ForeignKey('PaymentTransaction', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'subscriptions'
        indexes = [
            models.Index(fields=['user', 'status', 'end_date']),
        ]
    
    def is_active(self):
        return self.status == 'active' and self.end_date > timezone.now()
    
    def __str__(self):
        return f"{self.user.username} - {self.plan.name} ({self.status})"


class ListeningHistory(models.Model):
    """Track buku yang sudah didengarkan untuk enforcement limit"""
    visitor_id = models.CharField(max_length=100, blank=True, null=True, db_index=True)  # For guest users
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='listening_history')
    book_id = models.IntegerField(db_index=True)  # Reference ke tabel Book
    played_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'listening_history'
        unique_together = [['user', 'book_id'], ['visitor_id', 'book_id']]
        indexes = [
            models.Index(fields=['user', 'played_at']),
            models.Index(fields=['visitor_id', 'played_at']),
        ]
    
    def __str__(self):
        return f"{'Guest' if self.visitor_id else self.user.username} - Book #{self.book_id}"


class PaymentTransaction(models.Model):
    """Transaksi pembayaran Xendit"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('expired', 'Expired'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payment_transactions')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Xendit Invoice Data
    xendit_invoice_id = models.CharField(max_length=255, blank=True, db_index=True)
    xendit_invoice_url = models.URLField(max_length=500, blank=True)  # Payment page URL
    xendit_external_id = models.CharField(max_length=255, blank=True, db_index=True)  # Our reference
    xendit_payment_method = models.CharField(max_length=50, blank=True)  # QRIS, EWALLET, VIRTUAL_ACCOUNT, etc
    xendit_payment_channel = models.CharField(max_length=50, blank=True)  # GoPay, OVO, DANA, BCA, etc
    
    expired_at = models.DateTimeField()
    
    # Payment Info
    paid_at = models.DateTimeField(null=True, blank=True)
    payment_customer_name = models.CharField(max_length=255, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payment_transactions'
        indexes = [
            models.Index(fields=['user', 'status', 'created_at']),
            models.Index(fields=['xendit_invoice_id']),
            models.Index(fields=['xendit_external_id']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.plan.name} ({self.status})"
```

---

## 2. Serializers

```python
# serializers.py
from rest_framework import serializers
from .models import SubscriptionPlan, Subscription, ListeningHistory, PaymentTransaction

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'price', 'duration_days', 'description', 'is_active']


class SubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)
    
    class Meta:
        model = Subscription
        fields = ['id', 'plan', 'start_date', 'end_date', 'status', 'created_at']


class PaymentTransactionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)
    
    class Meta:
        model = PaymentTransaction
        fields = [
            'id', 'plan', 'amount', 'status', 
            'xendit_invoice_id', 'xendit_invoice_url', 'xendit_external_id',
            'xendit_payment_method', 'xendit_payment_channel',
            'expired_at', 'paid_at', 'payment_customer_name', 'created_at'
        ]
        read_only_fields = ['id', 'xendit_invoice_id', 'xendit_invoice_url', 'xendit_external_id']


class ListeningStatusSerializer(serializers.Serializer):
    can_listen = serializers.BooleanField()
    listen_count = serializers.IntegerField()
    limit = serializers.IntegerField(allow_null=True)
    has_subscription = serializers.BooleanField()
    subscription_ends_at = serializers.DateTimeField(allow_null=True)
    reason = serializers.CharField(allow_null=True)
```

---

## 3. Services (Business Logic)

```python
# services.py
import requests
import base64
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from .models import SubscriptionPlan, Subscription, ListeningHistory, PaymentTransaction

# Constants
GUEST_LISTEN_LIMIT = 1
FREE_USER_LISTEN_LIMIT = 3

class XenditAPIService:
    """Service untuk integrasi dengan Xendit API"""
    
    BASE_URL = "https://api.xendit.co"
    
    def __init__(self):
        self.secret_key = settings.XENDIT_SECRET_KEY
        # Create Basic Auth header
        auth_string = f"{self.secret_key}:"
        encoded_auth = base64.b64encode(auth_string.encode()).decode()
        self.headers = {
            'Authorization': f'Basic {encoded_auth}',
            'Content-Type': 'application/json'
        }
    
    def create_invoice(self, amount, customer_name, customer_email, description, external_id):
        """
        Buat invoice Xendit baru
        
        Args:
            amount: Jumlah pembayaran (IDR)
            customer_name: Nama customer
            customer_email: Email customer
            description: Deskripsi invoice
            external_id: ID referensi kita
            
        Returns:
            dict: {
                'invoice_id': str,
                'invoice_url': str,
                'external_id': str,
                'expiry_date': datetime
            }
        """
        url = f"{self.BASE_URL}/v2/invoices"
        
        payload = {
            'external_id': external_id,
            'amount': int(amount),
            'description': description,
            'invoice_duration': 86400,  # 24 hours in seconds
            'customer': {
                'given_names': customer_name,
                'email': customer_email,
            },
            'customer_notification_preference': {
                'invoice_created': ['email'],
                'invoice_reminder': ['email'],
                'invoice_paid': ['email'],
            },
            'success_redirect_url': f"{settings.APP_URL}/subscription?payment=success",
            'failure_redirect_url': f"{settings.APP_URL}/subscription?payment=failed",
            'currency': 'IDR',
            'payment_methods': ['QRIS', 'EWALLET', 'VIRTUAL_ACCOUNT', 'RETAIL_OUTLET'],
        }
        
        try:
            response = requests.post(url, json=payload, headers=self.headers, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            return {
                'invoice_id': data['id'],
                'invoice_url': data['invoice_url'],
                'external_id': data['external_id'],
                'expiry_date': data['expiry_date']
            }
        except requests.RequestException as e:
            raise Exception(f"Failed to create Xendit invoice: {str(e)}")
    
    def get_invoice(self, invoice_id):
        """
        Get invoice details dari Xendit
        
        Returns:
            dict: {
                'status': 'PENDING' | 'PAID' | 'SETTLED' | 'EXPIRED',
                'paid_at': datetime | None,
                'payment_method': str,
                'payment_channel': str
            }
        """
        url = f"{self.BASE_URL}/v2/invoices/{invoice_id}"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            return {
                'status': data['status'],
                'paid_at': data.get('paid_at'),
                'payment_method': data.get('payment_method', ''),
                'payment_channel': data.get('payment_channel', '')
            }
        except requests.RequestException as e:
            raise Exception(f"Failed to get invoice: {str(e)}")


class SubscriptionService:
    """Service untuk manajemen subscription"""
    
    @staticmethod
    def get_active_subscription(user):
        """Ambil subscription aktif user"""
        try:
            subscription = Subscription.objects.filter(
                user=user,
                status='active',
                end_date__gt=timezone.now()
            ).select_related('plan').latest('end_date')
            return subscription
        except Subscription.DoesNotExist:
            return None
    
    @staticmethod
    def create_subscription(user, plan, payment_transaction):
        """Buat subscription baru setelah pembayaran berhasil"""
        start_date = timezone.now()
        end_date = start_date + timedelta(days=plan.duration_days)
        
        subscription = Subscription.objects.create(
            user=user,
            plan=plan,
            start_date=start_date,
            end_date=end_date,
            status='active',
            payment_transaction=payment_transaction
        )
        return subscription


class ListeningLimitService:
    """Service untuk enforce listening limits"""
    
    @staticmethod
    def check_listening_status(user=None, visitor_id=None):
        """
        Cek apakah user/guest masih bisa mendengarkan
        
        Returns:
            dict: {
                'can_listen': bool,
                'listen_count': int,
                'limit': int | None,
                'has_subscription': bool,
                'subscription_ends_at': datetime | None,
                'reason': str | None
            }
        """
        # Cek subscription jika user login
        if user and user.is_authenticated:
            active_subscription = SubscriptionService.get_active_subscription(user)
            
            if active_subscription:
                return {
                    'can_listen': True,
                    'listen_count': 0,
                    'limit': None,
                    'has_subscription': True,
                    'subscription_ends_at': active_subscription.end_date,
                    'reason': None
                }
            
            # Free user (logged in, no subscription)
            listen_count = ListeningHistory.objects.filter(user=user).count()
            can_listen = listen_count < FREE_USER_LISTEN_LIMIT
            
            return {
                'can_listen': can_listen,
                'listen_count': listen_count,
                'limit': FREE_USER_LISTEN_LIMIT,
                'has_subscription': False,
                'subscription_ends_at': None,
                'reason': f'Anda sudah mendengarkan {listen_count} dari {FREE_USER_LISTEN_LIMIT} buku gratis. Silakan berlangganan untuk akses unlimited.' if not can_listen else None
            }
        
        # Guest user (not logged in)
        if visitor_id:
            listen_count = ListeningHistory.objects.filter(visitor_id=visitor_id).count()
            can_listen = listen_count < GUEST_LISTEN_LIMIT
            
            return {
                'can_listen': can_listen,
                'listen_count': listen_count,
                'limit': GUEST_LISTEN_LIMIT,
                'has_subscription': False,
                'subscription_ends_at': None,
                'reason': f'Anda sudah mendengarkan {listen_count} buku sebagai guest. Silakan login untuk mendapatkan 3 buku gratis, atau berlangganan untuk akses unlimited.' if not can_listen else None
            }
        
        return {
            'can_listen': False,
            'listen_count': 0,
            'limit': 0,
            'has_subscription': False,
            'subscription_ends_at': None,
            'reason': 'Silakan login atau daftar untuk mulai mendengarkan.'
        }
    
    @staticmethod
    def record_listening(book_id, user=None, visitor_id=None):
        """
        Record bahwa user mulai mendengarkan buku
        Raise ValidationError jika sudah mencapai limit
        """
        from django.core.exceptions import ValidationError
        
        # Cek status dulu
        status = ListeningLimitService.check_listening_status(user, visitor_id)
        
        # Cek apakah buku ini sudah pernah didengarkan (untuk idempotency)
        if user and user.is_authenticated:
            already_listened = ListeningHistory.objects.filter(
                user=user,
                book_id=book_id
            ).exists()
        elif visitor_id:
            already_listened = ListeningHistory.objects.filter(
                visitor_id=visitor_id,
                book_id=book_id
            ).exists()
        else:
            already_listened = False
        
        # Jika sudah pernah dengar buku ini, skip (allow replay)
        if already_listened:
            return {'message': 'Continue listening', 'already_recorded': True}
        
        # Enforce limit untuk buku baru
        if not status['can_listen']:
            raise ValidationError(status['reason'])
        
        # Record listening
        if user and user.is_authenticated:
            ListeningHistory.objects.create(user=user, book_id=book_id)
        elif visitor_id:
            ListeningHistory.objects.create(visitor_id=visitor_id, book_id=book_id)
        
        return {'message': 'Listening recorded', 'already_recorded': False}
```

---

## 4. Views / API Endpoints

```python
# views.py
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
from .models import SubscriptionPlan, Subscription, PaymentTransaction
from .serializers import (
    SubscriptionPlanSerializer, SubscriptionSerializer,
    PaymentTransactionSerializer, ListeningStatusSerializer
)
from .services import XenditAPIService, SubscriptionService, ListeningLimitService

# ============================================
# SUBSCRIPTION PLANS
# ============================================

@api_view(['GET'])
@permission_classes([AllowAny])
def get_subscription_plans(request):
    """
    GET /api/storify-subscription/plans
    
    Daftar semua paket langganan yang aktif
    """
    plans = SubscriptionPlan.objects.filter(is_active=True).order_by('price')
    serializer = SubscriptionPlanSerializer(plans, many=True)
    return Response(serializer.data)


# ============================================
# LISTENING STATUS & LIMITS
# ============================================

@api_view(['GET'])
@permission_classes([AllowAny])
def get_listening_status(request):
    """
    GET /api/storify-subscription/listening/status?visitor_id=xxx
    
    Cek apakah user/guest masih bisa mendengarkan
    """
    visitor_id = request.query_params.get('visitor_id')
    user = request.user if request.user.is_authenticated else None
    
    status_data = ListeningLimitService.check_listening_status(user, visitor_id)
    serializer = ListeningStatusSerializer(status_data)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def record_listening(request):
    """
    POST /api/storify-subscription/listening/record
    Body: {
        "book_id": 123,
        "visitor_id": "uuid-guest" (optional)
    }
    
    Record bahwa user mulai mendengarkan buku
    Return error 403 jika sudah mencapai limit
    """
    book_id = request.data.get('book_id')
    visitor_id = request.data.get('visitor_id')
    user = request.user if request.user.is_authenticated else None
    
    if not book_id:
        return Response(
            {'message': 'book_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        result = ListeningLimitService.record_listening(book_id, user, visitor_id)
        return Response(result)
    except ValidationError as e:
        return Response(
            {'message': str(e)},
            status=status.HTTP_403_FORBIDDEN
        )


# ============================================
# ACTIVE SUBSCRIPTION
# ============================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_active_subscription(request):
    """
    GET /api/storify-subscription/active
    
    Ambil subscription aktif user
    Return null jika tidak ada subscription aktif
    """
    subscription = SubscriptionService.get_active_subscription(request.user)
    
    if subscription:
        serializer = SubscriptionSerializer(subscription)
        return Response(serializer.data)
    
    return Response(None)


# ============================================
# PAYMENT / XENDIT
# ============================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment(request):
    """
    POST /api/storify-subscription/payment/create
    Body: {
        "plan_id": 1
    }
    
    Generate Xendit invoice untuk pembayaran
    Return invoice URL untuk redirect user
    """
    plan_id = request.data.get('plan_id')
    
    if not plan_id:
        return Response(
            {'message': 'plan_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
    except SubscriptionPlan.DoesNotExist:
        return Response(
            {'message': 'Invalid plan_id'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Generate external_id
    external_id = f"storify-{request.user.id}-{int(timezone.now().timestamp())}"
    
    # Create Xendit invoice
    xendit = XenditAPIService()
    
    try:
        invoice_data = xendit.create_invoice(
            amount=plan.price,
            customer_name=request.user.username,
            customer_email=request.user.email or f"{request.user.username}@storify.app",
            description=f"Storify Premium - {plan.name}",
            external_id=external_id
        )
        
        # Calculate expiry
        expiry_date = timezone.datetime.fromisoformat(invoice_data['expiry_date'].replace('Z', '+00:00'))
        
        # Save transaction to database
        transaction = PaymentTransaction.objects.create(
            user=request.user,
            plan=plan,
            amount=plan.price,
            status='pending',
            xendit_invoice_id=invoice_data['invoice_id'],
            xendit_invoice_url=invoice_data['invoice_url'],
            xendit_external_id=external_id,
            expired_at=expiry_date
        )
        
        serializer = PaymentTransactionSerializer(transaction)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'message': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_payment_status(request, transaction_id):
    """
    GET /api/storify-subscription/payment/<transaction_id>
    
    Cek status pembayaran (untuk polling dari frontend)
    """
    try:
        transaction = PaymentTransaction.objects.get(id=transaction_id)
    except PaymentTransaction.DoesNotExist:
        return Response(
            {'message': 'Transaction not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Jika masih pending, cek ke Xendit
    if transaction.status == 'pending' and transaction.xendit_invoice_id:
        xendit = XenditAPIService()
        
        try:
            invoice_data = xendit.get_invoice(transaction.xendit_invoice_id)
            
            # Map Xendit status ke internal status
            status_map = {
                'PENDING': 'pending',
                'PAID': 'paid',
                'SETTLED': 'paid',
                'EXPIRED': 'expired',
            }
            
            new_status = status_map.get(invoice_data['status'], 'pending')
            
            # Update transaction jika status berubah
            if new_status != transaction.status:
                transaction.status = new_status
                
                if new_status == 'paid':
                    transaction.paid_at = timezone.now()
                    transaction.xendit_payment_method = invoice_data.get('payment_method', '')
                    transaction.xendit_payment_channel = invoice_data.get('payment_channel', '')
                    
                    # Create subscription
                    SubscriptionService.create_subscription(
                        transaction.user,
                        transaction.plan,
                        transaction
                    )
                
                transaction.save()
        except Exception as e:
            # Log error but still return current status
            print(f"Error checking payment status: {e}")
    
    serializer = PaymentTransactionSerializer(transaction)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def update_payment_status(request, transaction_id):
    """
    POST /api/storify-subscription/payment/<transaction_id>/update
    Body: {
        "status": "paid",
        "xendit_payment_method": "EWALLET",
        "xendit_payment_channel": "GOPAY",
        "payment_customer_name": "John Doe"
    }
    
    Update status payment (untuk testing atau manual update)
    """
    try:
        transaction = PaymentTransaction.objects.get(id=transaction_id)
    except PaymentTransaction.DoesNotExist:
        return Response(
            {'message': 'Transaction not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    new_status = request.data.get('status')
    
    if new_status not in ['pending', 'paid', 'expired', 'failed']:
        return Response(
            {'message': 'Invalid status'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    transaction.status = new_status
    
    if new_status == 'paid':
        transaction.paid_at = timezone.now()
        transaction.xendit_payment_method = request.data.get('xendit_payment_method', '')
        transaction.xendit_payment_channel = request.data.get('xendit_payment_channel', '')
        transaction.payment_customer_name = request.data.get('payment_customer_name', '')
        
        # Create subscription
        SubscriptionService.create_subscription(
            transaction.user,
            transaction.plan,
            transaction
        )
    
    transaction.save()
    
    serializer = PaymentTransactionSerializer(transaction)
    return Response(serializer.data)


# ============================================
# XENDIT WEBHOOK
# ============================================

@csrf_exempt
def xendit_webhook(request):
    """
    POST /api/storify-subscription/webhook/xendit
    
    Webhook dari Xendit saat status invoice berubah
    Harus verify callback token untuk keamanan
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        # Verify webhook token
        webhook_token = request.headers.get('x-callback-token')
        if webhook_token != settings.XENDIT_WEBHOOK_TOKEN:
            return JsonResponse({'error': 'Invalid webhook token'}, status=401)
        
        payload = json.loads(request.body)
        external_id = payload.get('external_id')
        invoice_status = payload.get('status')
        
        # Find transaction by external_id
        try:
            transaction = PaymentTransaction.objects.get(xendit_external_id=external_id)
        except PaymentTransaction.DoesNotExist:
            return JsonResponse({'error': 'Transaction not found'}, status=404)
        
        # Map status
        status_map = {
            'PENDING': 'pending',
            'PAID': 'paid',
            'SETTLED': 'paid',
            'EXPIRED': 'expired',
        }
        
        new_status = status_map.get(invoice_status, 'pending')
        
        # Update transaction
        if new_status == 'paid' and transaction.status != 'paid':
            transaction.status = 'paid'
            transaction.paid_at = timezone.now()
            transaction.xendit_payment_method = payload.get('payment_method', '')
            transaction.xendit_payment_channel = payload.get('payment_channel', '')
            
            # Create subscription
            SubscriptionService.create_subscription(
                transaction.user,
                transaction.plan,
                transaction
            )
            
            transaction.save()
            
            return JsonResponse({'message': 'Payment confirmed'})
        elif new_status != transaction.status:
            transaction.status = new_status
            transaction.save()
        
        return JsonResponse({'message': 'Webhook processed'})
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
```

---

## 5. URLs Configuration

```python
# urls.py
from django.urls import path
from . import views

app_name = 'storify_subscription'

urlpatterns = [
    # Subscription Plans
    path('plans/', views.get_subscription_plans, name='subscription_plans'),
    
    # Listening Status & Limits
    path('listening/status/', views.get_listening_status, name='listening_status'),
    path('listening/record/', views.record_listening, name='record_listening'),
    
    # Active Subscription
    path('active/', views.get_active_subscription, name='active_subscription'),
    
    # Payment / Xendit
    path('payment/create/', views.create_payment, name='create_payment'),
    path('payment/<uuid:transaction_id>/', views.get_payment_status, name='payment_status'),
    path('payment/<uuid:transaction_id>/update/', views.update_payment_status, name='update_payment'),
    
    # Webhook
    path('webhook/xendit/', views.xendit_webhook, name='xendit_webhook'),
]
```

**Main urls.py:**
```python
# project/urls.py
from django.urls import path, include

urlpatterns = [
    # ... other urls
    path('api/storify-subscription/', include('subscription.urls')),
]
```

---

## 6. Settings Configuration

```python
# settings.py

# Xendit Configuration
XENDIT_SECRET_KEY = env('XENDIT_SECRET_KEY')  # dari environment variable
XENDIT_WEBHOOK_TOKEN = env('XENDIT_WEBHOOK_TOKEN')  # untuk verify webhook
XENDIT_PUBLIC_KEY = env('XENDIT_PUBLIC_KEY')  # optional, untuk frontend

# Application URL (untuk redirect)
APP_URL = env('APP_URL', default='http://localhost:8000')
```

**Environment Variables (.env):**
```
XENDIT_SECRET_KEY=xnd_development_...
XENDIT_WEBHOOK_TOKEN=your_webhook_verification_token
XENDIT_PUBLIC_KEY=xnd_public_development_...
APP_URL=https://yourdomain.com
```

---

## 7. Migrations

```bash
# Generate migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Seed subscription plans
python manage.py shell
```

```python
# Seed data
from subscription.models import SubscriptionPlan

plans = [
    {'name': 'Mingguan', 'price': 15000, 'duration_days': 7, 'description': 'Akses unlimited selama 1 minggu'},
    {'name': 'Bulanan', 'price': 49000, 'duration_days': 30, 'description': 'Akses unlimited selama 1 bulan - BEST VALUE'},
    {'name': 'Tahunan', 'price': 399000, 'duration_days': 365, 'description': 'Akses unlimited selama 1 tahun'},
]

for plan_data in plans:
    SubscriptionPlan.objects.get_or_create(**plan_data)
```

---

## 8. Xendit Dashboard Setup

### 8.1. Create Account & Get API Keys
1. Daftar di [https://dashboard.xendit.co/](https://dashboard.xendit.co/)
2. Verify email dan lengkapi data bisnis
3. Mode Development: Gunakan test API key
4. Mode Production: Submit dokumen untuk approval

### 8.2. Get API Keys
```
Settings → Developers → API Keys

Secret Key (untuk backend):
xnd_development_...  (test mode)
xnd_production_...   (live mode)

Public Key (untuk frontend, optional):
xnd_public_development_...
xnd_public_production_...
```

### 8.3. Setup Webhook
```
Settings → Developers → Callbacks

Invoice Webhook URL:
https://yourdomain.com/api/storify-subscription/webhook/xendit/

Events to subscribe:
✅ invoice.paid
✅ invoice.expired
✅ invoice.pending

Verification Token:
Generate random token dan simpan di .env sebagai XENDIT_WEBHOOK_TOKEN
```

### 8.4. Test Mode Payment
Xendit menyediakan test credentials untuk testing:

**E-Wallet Test Numbers:**
- GoPay: 081234567890
- OVO: 081234567891
- DANA: 081234567892
- ShopeePay: 081234567893

**Virtual Account:**
- BCA: 1234567890
- Mandiri: 9876543210
- BNI: 1122334455

**QRIS:**
Scan QR dengan Xendit Test App atau simulator

---

## 9. Testing Endpoints

### Test dengan cURL:

```bash
# 1. Get subscription plans
curl http://localhost:8000/api/storify-subscription/plans/

# 2. Check listening status (guest)
curl "http://localhost:8000/api/storify-subscription/listening/status/?visitor_id=guest-123"

# 3. Check listening status (logged in user)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/storify-subscription/listening/status/

# 4. Record listening (guest)
curl -X POST http://localhost:8000/api/storify-subscription/listening/record/ \
  -H "Content-Type: application/json" \
  -d '{"book_id": 1, "visitor_id": "guest-123"}'

# 5. Create payment (requires auth)
curl -X POST http://localhost:8000/api/storify-subscription/payment/create/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan_id": 2}'

# Response:
{
  "id": "uuid-here",
  "xendit_invoice_url": "https://checkout-staging.xendit.co/v2/...",
  "amount": 49000,
  "status": "pending",
  "expired_at": "2024-02-06T10:00:00Z"
}

# 6. Check payment status
curl http://localhost:8000/api/storify-subscription/payment/TRANSACTION_UUID/

# 7. Simulate webhook (for testing)
curl -X POST http://localhost:8000/api/storify-subscription/webhook/xendit/ \
  -H "Content-Type: application/json" \
  -H "x-callback-token: YOUR_WEBHOOK_TOKEN" \
  -d '{
    "external_id": "storify-1-1234567890",
    "status": "PAID",
    "payment_method": "EWALLET",
    "payment_channel": "GOPAY"
  }'
```

---

## 10. Payment Flow Diagram

```
User                Frontend              Backend               Xendit
 |                     |                     |                     |
 |---(1) Click Plan--->|                     |                     |
 |                     |                     |                     |
 |                     |---(2) POST /payment/create              |
 |                     |                     |                     |
 |                     |                     |---(3) Create Invoice-->|
 |                     |                     |                     |
 |                     |                     |<--(4) Invoice URL---|
 |                     |                     |                     |
 |                     |<--(5) Return URL----|                     |
 |                     |                     |                     |
 |<--(6) Redirect to Xendit Page------------>|                     |
 |                     |                     |                     |
 |---(7) Choose Payment Method-------------->|                     |
 |                     |                     |                     |
 |---(8) Complete Payment------------------->|                     |
 |                     |                     |                     |
 |                     |                     |<--(9) Webhook------|
 |                     |                     |                     |
 |                     |                     |---(10) Activate Subscription
 |                     |                     |                     |
 |<--(11) Redirect Success Page--------------|                     |
 |                     |                     |                     |
 |                     |---(12) Poll Status->|                     |
 |                     |                     |                     |
 |                     |<--(13) Status=paid--|                     |
```

---

## 11. Admin Panel Setup

```python
# admin.py
from django.contrib import admin
from .models import SubscriptionPlan, Subscription, ListeningHistory, PaymentTransaction

@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'duration_days', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name']


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'status', 'start_date', 'end_date', 'created_at']
    list_filter = ['status', 'plan']
    search_fields = ['user__username', 'user__email']
    date_hierarchy = 'created_at'


@admin.register(ListeningHistory)
class ListeningHistoryAdmin(admin.ModelAdmin):
    list_display = ['user', 'visitor_id', 'book_id', 'played_at']
    list_filter = ['played_at']
    search_fields = ['user__username', 'visitor_id', 'book_id']
    date_hierarchy = 'played_at'


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'plan', 'amount', 'status', 'xendit_payment_channel', 'created_at']
    list_filter = ['status', 'xendit_payment_method', 'xendit_payment_channel', 'created_at']
    search_fields = ['user__username', 'xendit_invoice_id', 'xendit_external_id']
    date_hierarchy = 'created_at'
    readonly_fields = ['id', 'xendit_invoice_id', 'xendit_invoice_url', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Transaction Info', {
            'fields': ('id', 'user', 'plan', 'amount', 'status', 'created_at', 'updated_at')
        }),
        ('Xendit Data', {
            'fields': ('xendit_invoice_id', 'xendit_invoice_url', 'xendit_external_id', 
                      'xendit_payment_method', 'xendit_payment_channel')
        }),
        ('Payment Details', {
            'fields': ('expired_at', 'paid_at', 'payment_customer_name')
        }),
    )
```

---

## 12. Deployment Checklist

- [ ] Set environment variables: `XENDIT_SECRET_KEY`, `XENDIT_WEBHOOK_TOKEN`, `APP_URL`
- [ ] Run migrations: `python manage.py migrate`
- [ ] Seed subscription plans
- [ ] Test all endpoints dengan Postman/cURL
- [ ] Setup webhook URL di Xendit Dashboard
- [ ] Test webhook dengan Xendit webhook tester
- [ ] Monitor transaction logs
- [ ] Setup cron job untuk expire subscriptions yang sudah lewat end_date
- [ ] Switch to production API keys setelah testing selesai
- [ ] Enable HTTPS untuk webhook security
- [ ] Setup logging untuk payment transactions
- [ ] Setup monitoring alerts untuk failed payments

---

## 13. Security Best Practices

### 13.1. Webhook Verification
```python
# Always verify webhook token
webhook_token = request.headers.get('x-callback-token')
if webhook_token != settings.XENDIT_WEBHOOK_TOKEN:
    return JsonResponse({'error': 'Unauthorized'}, status=401)
```

### 13.2. API Key Protection
```python
# Never expose secret key in frontend
# Never commit API keys to git
# Use environment variables
# Rotate keys regularly
```

### 13.3. Idempotency
```python
# Handle duplicate webhook calls
if transaction.status == 'paid':
    return JsonResponse({'message': 'Already processed'})
```

### 13.4. Input Validation
```python
# Validate all user inputs
# Sanitize external_id
# Check amount matches plan price
```

---

## Summary Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/storify-subscription/plans/` | No | Daftar paket langganan |
| GET | `/api/storify-subscription/listening/status/` | No | Cek listening limit status |
| POST | `/api/storify-subscription/listening/record/` | No | Record listening (enforce limit) |
| GET | `/api/storify-subscription/active/` | Yes | Subscription aktif user |
| POST | `/api/storify-subscription/payment/create/` | Yes | Generate Xendit invoice |
| GET | `/api/storify-subscription/payment/:id/` | No | Cek status payment (polling) |
| POST | `/api/storify-subscription/payment/:id/update/` | No | Update payment status (testing) |
| POST | `/api/storify-subscription/webhook/xendit/` | Webhook | Webhook dari Xendit |

**Tag/Prefix**: `/api/storify-subscription/` (berbeda dari endpoint payment lainnya)

**Payment Gateway**: Xendit - Support untuk QRIS, E-Wallet (GoPay, OVO, DANA, ShopeePay), Virtual Account (BCA, Mandiri, BNI, BRI), Retail Outlet (Alfamart, Indomaret)
