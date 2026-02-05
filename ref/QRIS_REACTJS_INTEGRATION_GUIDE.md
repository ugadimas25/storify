# Panduan Integrasi QRIS Payment untuk ReactJS

Dokumentasi ini berisi panduan lengkap untuk mengimplementasikan mekanisme pembayaran QRIS pada platform ReactJS berdasarkan backend API Pewaca.

---

## 📋 Daftar Isi

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Konfigurasi API](#konfigurasi-api)
4. [API Endpoints](#api-endpoints)
5. [Flow Pembayaran QRIS](#flow-pembayaran-qris)
6. [Implementasi React Components](#implementasi-react-components)
7. [Custom Hooks](#custom-hooks)
8. [State Management](#state-management)
9. [Error Handling](#error-handling)
10. [Security Best Practices](#security-best-practices)
11. [Testing](#testing)

---

## Overview

Sistem pembayaran QRIS Pewaca menggunakan backend Django API yang hosted di `https://admin-v2.pewaca.id/api`. Semua endpoint memerlukan JWT authentication.

### Fitur Utama:
- ✅ Generate QRIS dinamis
- ✅ Polling status pembayaran real-time
- ✅ Support pembayaran tagihan tunggal dan multi-periode
- ✅ Webhook untuk notifikasi pembayaran
- ✅ Riwayat transaksi

---

## Prerequisites

### Dependencies yang Diperlukan

```bash
npm install axios qrcode.react @tanstack/react-query
# atau dengan yarn
yarn add axios qrcode.react @tanstack/react-query
```

### Environment Variables

Buat file `.env`:

```env
REACT_APP_API_BASE_URL=https://admin-v2.pewaca.id/api
REACT_APP_QRIS_POLL_INTERVAL=5000
REACT_APP_QRIS_EXPIRY_MINUTES=30
```

---

## Konfigurasi API

### Axios Instance

```typescript
// src/api/axiosInstance.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor untuk menambahkan token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor untuk handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('jwt_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## API Endpoints

### 1. Check QRIS Configuration

Cek apakah residence memiliki konfigurasi QRIS aktif.

```typescript
// src/api/qrisApi.ts
import apiClient from './axiosInstance';

interface QrisConfig {
  config_id: number;
  residence: string;
  is_active: boolean;
  use_tip: boolean;
}

interface QrisConfigResponse {
  status: string;
  data: QrisConfig | null;
}

export const checkQrisConfig = async (): Promise<QrisConfigResponse> => {
  const response = await apiClient.get('/qris/config/');
  return response.data;
};
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "config_id": 1,
    "residence": "Perumahan ABC",
    "is_active": true,
    "use_tip": false
  }
}
```

> ⚠️ **Penting**: Jika `data` kosong/null, jangan tampilkan opsi pembayaran QRIS.

---

### 2. Create QRIS Invoice

Generate invoice QRIS baru.

```typescript
interface CreateInvoiceParams {
  tagihan_warga_id?: number;  // Optional: ID tagihan
  amount: string;              // Required: Jumlah pembayaran
  use_tip: 'yes' | 'no';      // Required: Gunakan tip atau tidak
  custom_trx_number?: string;  // Optional: Nomor referensi custom
}

interface QrisInvoiceData {
  transaction_id: number;
  qris_invoiceid: string;
  qris_content: string;        // String untuk generate QR Code
  qris_nmid: string;
  cli_trx_number: string;
  cli_trx_amount: string;
  status: 'pending' | 'paid' | 'expired' | 'failed';
  expired_at: string;          // ISO datetime
  remaining_time: number;      // Detik tersisa
}

interface CreateInvoiceResponse {
  status: string;
  data: QrisInvoiceData;
}

export const createQrisInvoice = async (
  params: CreateInvoiceParams
): Promise<CreateInvoiceResponse> => {
  const response = await apiClient.post('/qris/create-invoice/', params);
  return response.data;
};
```

**Request:**
```json
{
  "tagihan_warga_id": 304,
  "amount": "150000",
  "use_tip": "no",
  "custom_trx_number": "INV-2024-001"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "transaction_id": 15,
    "qris_invoiceid": "413255111",
    "qris_content": "00020101021226680016ID.CO.QPN.WWW0118936009140232050002...",
    "qris_nmid": "ID1020021312312",
    "cli_trx_number": "INV-2024-001",
    "cli_trx_amount": "150000.00",
    "status": "pending",
    "expired_at": "2024-01-31T10:35:00Z",
    "remaining_time": 1799
  }
}
```

---

### 3. Check Payment Status

Polling status pembayaran.

```typescript
interface PaymentStatusData {
  transaction: {
    status: 'pending' | 'paid' | 'expired' | 'failed';
    payment_date?: string;
    payment_customer_name?: string;
    payment_method_by?: string;
  };
}

interface PaymentStatusResponse {
  status: string;
  data: PaymentStatusData;
}

export const checkPaymentStatus = async (
  transactionId: number
): Promise<PaymentStatusResponse> => {
  const response = await apiClient.get(
    `/qris/check-status/?transaction_id=${transactionId}`
  );
  return response.data;
};
```

**Response (Pending):**
```json
{
  "status": "success",
  "data": {
    "transaction": {
      "status": "pending"
    }
  }
}
```

**Response (Paid):**
```json
{
  "status": "success",
  "data": {
    "transaction": {
      "status": "paid",
      "payment_date": "2024-01-31T10:10:00Z",
      "payment_customer_name": "JOHN DOE",
      "payment_method_by": "BCA Mobile"
    }
  }
}
```

---

### 4. Transaction History

Mengambil riwayat transaksi.

```typescript
interface TransactionHistoryParams {
  status?: 'pending' | 'paid' | 'expired' | 'failed';
  page?: number;
}

export const getTransactionHistory = async (
  params?: TransactionHistoryParams
) => {
  const queryString = new URLSearchParams(
    params as Record<string, string>
  ).toString();
  const response = await apiClient.get(`/qris/transactions/?${queryString}`);
  return response.data;
};
```

---

### 5. Transaction Detail

Mengambil detail transaksi spesifik.

```typescript
export const getTransactionDetail = async (transactionId: number) => {
  const response = await apiClient.get(`/qris/transactions/${transactionId}/`);
  return response.data;
};
```

---

### 6. Refresh Transaction Status

Memaksa refresh status dari payment gateway.

```typescript
export const refreshTransactionStatus = async (transactionId: number) => {
  const response = await apiClient.post(
    `/qris/transactions/${transactionId}/refresh_status/`
  );
  return response.data;
};
```

---

## Flow Pembayaran QRIS

```
┌─────────────────────────────────────────────────────────────────┐
│                        FLOW PEMBAYARAN QRIS                      │
└─────────────────────────────────────────────────────────────────┘

1. CHECK CONFIG
   ┌──────────┐     GET /qris/config/      ┌──────────┐
   │  React   │ ─────────────────────────▶ │  Django  │
   │   App    │ ◀───────────────────────── │   API    │
   └──────────┘     { is_active: true }    └──────────┘
        │
        ▼ (if active)
        
2. CREATE INVOICE
   ┌──────────┐   POST /qris/create-invoice/   ┌──────────┐
   │  React   │ ─────────────────────────────▶ │  Django  │
   │   App    │ ◀───────────────────────────── │   API    │
   └──────────┘     { qris_content, ... }      └──────────┘
        │
        ▼
        
3. DISPLAY QR CODE
   ┌─────────────────────────────┐
   │  ┌───────────────────────┐  │
   │  │      QR CODE          │  │
   │  │    ██████████████     │  │
   │  │    ██████████████     │  │
   │  │    ██████████████     │  │
   │  └───────────────────────┘  │
   │  Amount: Rp 150.000         │
   │  Expires in: 29:45          │
   └─────────────────────────────┘
        │
        ▼ (every 5 seconds)
        
4. POLLING STATUS
   ┌──────────┐  GET /qris/check-status/   ┌──────────┐
   │  React   │ ─────────────────────────▶ │  Django  │
   │   App    │ ◀───────────────────────── │   API    │
   └──────────┘      { status: "..." }     └──────────┘
        │
        ├──── status: "pending" ────▶ Continue polling
        │
        ├──── status: "paid" ───────▶ Show success screen
        │
        └──── status: "expired" ────▶ Show expired message

5. PAYMENT SUCCESS
   ┌─────────────────────────────┐
   │     ✅ Pembayaran Berhasil  │
   │                             │
   │   Nama: JOHN DOE            │
   │   Via: BCA Mobile           │
   │   Tanggal: 31 Jan 2024      │
   └─────────────────────────────┘
```

---

## Implementasi React Components

### 1. QRIS Payment Page

```tsx
// src/pages/QrisPaymentPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useQrisPayment } from '../hooks/useQrisPayment';
import { formatCurrency, formatTime } from '../utils/formatters';
import LoadingSpinner from '../components/LoadingSpinner';
import PaymentSuccess from '../components/PaymentSuccess';
import PaymentExpired from '../components/PaymentExpired';

interface QrisPaymentPageProps {
  tagihanId?: number;
  amount: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const QrisPaymentPage: React.FC<QrisPaymentPageProps> = ({
  tagihanId,
  amount,
  onSuccess,
  onCancel,
}) => {
  const {
    invoice,
    status,
    paymentInfo,
    remainingTime,
    isLoading,
    error,
    createInvoice,
    downloadQR,
  } = useQrisPayment();

  // Create invoice on mount
  useEffect(() => {
    createInvoice({
      tagihan_warga_id: tagihanId,
      amount: amount.toString(),
      use_tip: 'no',
    });
  }, [tagihanId, amount, createInvoice]);

  // Handle success callback
  useEffect(() => {
    if (status === 'paid' && onSuccess) {
      const timer = setTimeout(onSuccess, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, onSuccess]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Memuat QRIS...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (status === 'paid') {
    return <PaymentSuccess paymentInfo={paymentInfo} />;
  }

  if (status === 'expired') {
    return <PaymentExpired onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pembayaran QRIS</h1>
        <p className="text-gray-600 mt-2">
          Scan QR Code di bawah menggunakan aplikasi e-wallet atau mobile banking
        </p>
      </div>

      {/* Amount */}
      <div className="text-center mb-6">
        <p className="text-sm text-gray-500">Total Pembayaran</p>
        <p className="text-3xl font-bold text-green-600">
          {formatCurrency(amount)}
        </p>
      </div>

      {/* QR Code */}
      {invoice?.qris_content && (
        <div className="flex flex-col items-center mb-6">
          <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
            <QRCodeSVG
              id="qris-code"
              value={invoice.qris_content}
              size={250}
              level="M"
              includeMargin={true}
            />
          </div>

          {/* Transaction Info */}
          <div className="mt-4 text-center text-sm text-gray-500">
            <p>ID Transaksi: {invoice.cli_trx_number}</p>
            <p>NMID: {invoice.qris_nmid}</p>
          </div>
        </div>
      )}

      {/* Timer */}
      <div className="text-center mb-6">
        <p className="text-sm text-gray-500">Berlaku hingga</p>
        <p className={`text-2xl font-mono font-bold ${
          remainingTime < 300 ? 'text-red-600' : 'text-gray-800'
        }`}>
          {formatTime(remainingTime)}
        </p>
        {remainingTime < 300 && (
          <p className="text-red-500 text-sm mt-1">
            ⚠️ QR Code akan segera kadaluarsa!
          </p>
        )}
      </div>

      {/* Status Indicator */}
      <div className="flex items-center justify-center mb-6">
        <div className="animate-pulse flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
          <span className="text-gray-600">Menunggu pembayaran...</span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={downloadQR}
          className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download QR Code
        </button>

        <button
          onClick={onCancel}
          className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition"
        >
          Batal
        </button>
      </div>

      {/* Payment Methods Info */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-500 text-center mb-3">
          Didukung oleh:
        </p>
        <div className="flex justify-center space-x-4">
          <img src="/images/gopay.png" alt="GoPay" className="h-8" />
          <img src="/images/ovo.png" alt="OVO" className="h-8" />
          <img src="/images/dana.png" alt="DANA" className="h-8" />
          <img src="/images/shopeepay.png" alt="ShopeePay" className="h-8" />
        </div>
      </div>
    </div>
  );
};

export default QrisPaymentPage;
```

---

### 2. Payment Success Component

```tsx
// src/components/PaymentSuccess.tsx
import React from 'react';
import { formatCurrency, formatDateTime } from '../utils/formatters';

interface PaymentInfo {
  payment_date?: string;
  payment_customer_name?: string;
  payment_method_by?: string;
  amount?: number;
}

interface PaymentSuccessProps {
  paymentInfo: PaymentInfo;
  onClose?: () => void;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({
  paymentInfo,
  onClose,
}) => {
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
      {/* Success Icon */}
      <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
        <svg
          className="w-12 h-12 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Pembayaran Berhasil!
      </h1>
      <p className="text-gray-600 mb-6">
        Terima kasih, pembayaran Anda telah dikonfirmasi.
      </p>

      {/* Payment Details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
        {paymentInfo.payment_customer_name && (
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-500">Nama Pembayar</span>
            <span className="font-medium">{paymentInfo.payment_customer_name}</span>
          </div>
        )}
        {paymentInfo.payment_method_by && (
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-500">Metode Pembayaran</span>
            <span className="font-medium">{paymentInfo.payment_method_by}</span>
          </div>
        )}
        {paymentInfo.payment_date && (
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-500">Waktu Pembayaran</span>
            <span className="font-medium">
              {formatDateTime(paymentInfo.payment_date)}
            </span>
          </div>
        )}
        {paymentInfo.amount && (
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Jumlah</span>
            <span className="font-bold text-green-600">
              {formatCurrency(paymentInfo.amount)}
            </span>
          </div>
        )}
      </div>

      <button
        onClick={onClose}
        className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition"
      >
        Selesai
      </button>
    </div>
  );
};

export default PaymentSuccess;
```

---

### 3. Payment Expired Component

```tsx
// src/components/PaymentExpired.tsx
import React from 'react';

interface PaymentExpiredProps {
  onRetry?: () => void;
  onCancel?: () => void;
}

const PaymentExpired: React.FC<PaymentExpiredProps> = ({ onRetry, onCancel }) => {
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
      {/* Expired Icon */}
      <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
        <svg
          className="w-12 h-12 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        QR Code Kadaluarsa
      </h1>
      <p className="text-gray-600 mb-6">
        Waktu pembayaran telah habis. Silakan buat QR Code baru untuk melanjutkan pembayaran.
      </p>

      <div className="space-y-3">
        <button
          onClick={onRetry}
          className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition"
        >
          Buat QR Code Baru
        </button>
        <button
          onClick={onCancel}
          className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition"
        >
          Kembali
        </button>
      </div>
    </div>
  );
};

export default PaymentExpired;
```

---

## Custom Hooks

### useQrisPayment Hook

```tsx
// src/hooks/useQrisPayment.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  createQrisInvoice,
  checkPaymentStatus,
  CreateInvoiceParams,
  QrisInvoiceData,
} from '../api/qrisApi';

interface PaymentInfo {
  payment_date?: string;
  payment_customer_name?: string;
  payment_method_by?: string;
}

interface UseQrisPaymentReturn {
  invoice: QrisInvoiceData | null;
  status: 'idle' | 'pending' | 'paid' | 'expired' | 'failed';
  paymentInfo: PaymentInfo;
  remainingTime: number;
  isLoading: boolean;
  error: string | null;
  createInvoice: (params: CreateInvoiceParams) => Promise<void>;
  downloadQR: () => void;
  refresh: () => void;
}

const POLL_INTERVAL = parseInt(process.env.REACT_APP_QRIS_POLL_INTERVAL || '5000');

export const useQrisPayment = (): UseQrisPaymentReturn => {
  const [invoice, setInvoice] = useState<QrisInvoiceData | null>(null);
  const [status, setStatus] = useState<'idle' | 'pending' | 'paid' | 'expired' | 'failed'>('idle');
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({});
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup intervals
  const cleanupIntervals = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Create invoice
  const createInvoice = useCallback(async (params: CreateInvoiceParams) => {
    setIsLoading(true);
    setError(null);
    cleanupIntervals();

    try {
      const response = await createQrisInvoice(params);
      
      if (response.status === 'success' && response.data) {
        setInvoice(response.data);
        setStatus('pending');
        setRemainingTime(response.data.remaining_time);
      } else {
        throw new Error('Gagal membuat invoice QRIS');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Terjadi kesalahan');
      setStatus('failed');
    } finally {
      setIsLoading(false);
    }
  }, [cleanupIntervals]);

  // Poll payment status
  const pollStatus = useCallback(async () => {
    if (!invoice?.transaction_id || status !== 'pending') return;

    try {
      const response = await checkPaymentStatus(invoice.transaction_id);
      const newStatus = response.data.transaction.status;

      if (newStatus === 'paid') {
        setStatus('paid');
        setPaymentInfo({
          payment_date: response.data.transaction.payment_date,
          payment_customer_name: response.data.transaction.payment_customer_name,
          payment_method_by: response.data.transaction.payment_method_by,
        });
        cleanupIntervals();
      } else if (newStatus === 'expired') {
        setStatus('expired');
        cleanupIntervals();
      } else if (newStatus === 'failed') {
        setStatus('failed');
        cleanupIntervals();
      }
    } catch (err) {
      console.error('Error polling status:', err);
      // Don't set error state, just log - polling will retry
    }
  }, [invoice?.transaction_id, status, cleanupIntervals]);

  // Start polling when invoice is created
  useEffect(() => {
    if (invoice && status === 'pending') {
      // Start polling
      pollIntervalRef.current = setInterval(pollStatus, POLL_INTERVAL);

      // Start countdown timer
      timerIntervalRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            setStatus('expired');
            cleanupIntervals();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return cleanupIntervals;
  }, [invoice, status, pollStatus, cleanupIntervals]);

  // Download QR Code
  const downloadQR = useCallback(() => {
    const svg = document.getElementById('qris-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      const link = document.createElement('a');
      link.download = `QRIS-${invoice?.cli_trx_number || 'payment'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, [invoice?.cli_trx_number]);

  // Refresh/retry
  const refresh = useCallback(() => {
    setInvoice(null);
    setStatus('idle');
    setPaymentInfo({});
    setRemainingTime(0);
    setError(null);
    cleanupIntervals();
  }, [cleanupIntervals]);

  return {
    invoice,
    status,
    paymentInfo,
    remainingTime,
    isLoading,
    error,
    createInvoice,
    downloadQR,
    refresh,
  };
};
```

---

### useQrisConfig Hook

```tsx
// src/hooks/useQrisConfig.ts
import { useState, useEffect, useCallback } from 'react';
import { checkQrisConfig, QrisConfig } from '../api/qrisApi';

interface UseQrisConfigReturn {
  config: QrisConfig | null;
  isQrisAvailable: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useQrisConfig = (): UseQrisConfigReturn => {
  const [config, setConfig] = useState<QrisConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await checkQrisConfig();
      setConfig(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
      setConfig(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const isQrisAvailable = !!(config && config.is_active);

  return {
    config,
    isQrisAvailable,
    isLoading,
    error,
    refetch: fetchConfig,
  };
};
```

---

## State Management

### Dengan React Query (Direkomendasikan)

```tsx
// src/hooks/useQrisQuery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  checkQrisConfig,
  createQrisInvoice,
  checkPaymentStatus,
  getTransactionHistory,
} from '../api/qrisApi';

// Query keys
export const qrisKeys = {
  all: ['qris'] as const,
  config: () => [...qrisKeys.all, 'config'] as const,
  transactions: () => [...qrisKeys.all, 'transactions'] as const,
  transaction: (id: number) => [...qrisKeys.transactions(), id] as const,
  status: (id: number) => [...qrisKeys.all, 'status', id] as const,
};

// Config query
export const useQrisConfigQuery = () => {
  return useQuery({
    queryKey: qrisKeys.config(),
    queryFn: checkQrisConfig,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create invoice mutation
export const useCreateInvoiceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createQrisInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qrisKeys.transactions() });
    },
  });
};

// Status polling query
export const usePaymentStatusQuery = (
  transactionId: number | null,
  options?: { enabled?: boolean; refetchInterval?: number }
) => {
  return useQuery({
    queryKey: qrisKeys.status(transactionId!),
    queryFn: () => checkPaymentStatus(transactionId!),
    enabled: !!transactionId && options?.enabled !== false,
    refetchInterval: (data) => {
      // Stop polling if paid or expired
      if (data?.data?.transaction?.status === 'paid' ||
          data?.data?.transaction?.status === 'expired') {
        return false;
      }
      return options?.refetchInterval ?? 5000;
    },
  });
};

// Transaction history query
export const useTransactionHistoryQuery = (status?: string) => {
  return useQuery({
    queryKey: [...qrisKeys.transactions(), { status }],
    queryFn: () => getTransactionHistory({ status: status as any }),
  });
};
```

---

## Utility Functions

```tsx
// src/utils/formatters.ts

/**
 * Format number to Indonesian Rupiah currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format seconds to MM:SS
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format ISO datetime to Indonesian locale
 */
export const formatDateTime = (isoString: string): string => {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(isoString));
};

/**
 * Format date only
 */
export const formatDate = (isoString: string): string => {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
  }).format(new Date(isoString));
};
```

---

## Error Handling

### Error Types

```typescript
// src/types/errors.ts

export interface ApiError {
  status: string;
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

export const ERROR_CODES = {
  QRIS_CONFIG_NOT_FOUND: 'QRIS tidak tersedia untuk residence ini',
  QRIS_INVOICE_FAILED: 'Gagal membuat invoice QRIS',
  QRIS_EXPIRED: 'QR Code telah kadaluarsa',
  NETWORK_ERROR: 'Koneksi gagal. Periksa koneksi internet Anda',
  UNAUTHORIZED: 'Sesi Anda telah berakhir. Silakan login kembali',
  SERVER_ERROR: 'Terjadi kesalahan pada server',
} as const;

export const getErrorMessage = (error: any): string => {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    if (status === 401) return ERROR_CODES.UNAUTHORIZED;
    if (status === 404) return data?.message || 'Data tidak ditemukan';
    if (status >= 500) return ERROR_CODES.SERVER_ERROR;
    
    return data?.message || 'Terjadi kesalahan';
  }

  if (error.request) {
    return ERROR_CODES.NETWORK_ERROR;
  }

  return error.message || 'Terjadi kesalahan';
};
```

### Error Boundary

```tsx
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Payment Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold text-red-600">Terjadi Kesalahan</h2>
          <p className="text-gray-600 mt-2">
            Silakan refresh halaman atau coba lagi nanti.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Refresh
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

---

## Security Best Practices

### 1. Token Management

```typescript
// src/utils/auth.ts

const TOKEN_KEY = 'jwt_token';
const TOKEN_EXPIRY_KEY = 'jwt_token_expiry';

export const setToken = (token: string, expiresIn: number): void => {
  localStorage.setItem(TOKEN_KEY, token);
  const expiry = Date.now() + expiresIn * 1000;
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
};

export const getToken = (): string | null => {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (expiry && Date.now() > parseInt(expiry)) {
    removeToken();
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};
```

### 2. Request Validation

```typescript
// src/utils/validation.ts

export const validateAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 100000000; // Max 100 juta
};

export const sanitizeInput = (input: string): string => {
  return input.replace(/[<>\"'&]/g, '');
};
```

### 3. HTTPS Only

Pastikan semua request menggunakan HTTPS:

```typescript
// Di axiosInstance.ts
if (process.env.NODE_ENV === 'production' && 
    !process.env.REACT_APP_API_BASE_URL?.startsWith('https')) {
  throw new Error('API URL must use HTTPS in production');
}
```

---

## Testing

### Unit Test untuk useQrisPayment

```tsx
// src/hooks/__tests__/useQrisPayment.test.tsx
import { renderHook, act, waitFor } from '@testing-library/react';
import { useQrisPayment } from '../useQrisPayment';
import * as qrisApi from '../../api/qrisApi';

jest.mock('../../api/qrisApi');

const mockInvoiceResponse = {
  status: 'success',
  data: {
    transaction_id: 1,
    qris_content: 'mock-qris-content',
    qris_nmid: 'ID123',
    cli_trx_number: 'TRX-001',
    cli_trx_amount: '100000',
    status: 'pending',
    expired_at: new Date(Date.now() + 1800000).toISOString(),
    remaining_time: 1800,
  },
};

describe('useQrisPayment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should create invoice successfully', async () => {
    (qrisApi.createQrisInvoice as jest.Mock).mockResolvedValue(mockInvoiceResponse);

    const { result } = renderHook(() => useQrisPayment());

    await act(async () => {
      await result.current.createInvoice({
        amount: '100000',
        use_tip: 'no',
      });
    });

    expect(result.current.invoice).toEqual(mockInvoiceResponse.data);
    expect(result.current.status).toBe('pending');
  });

  it('should handle payment success', async () => {
    (qrisApi.createQrisInvoice as jest.Mock).mockResolvedValue(mockInvoiceResponse);
    (qrisApi.checkPaymentStatus as jest.Mock).mockResolvedValue({
      status: 'success',
      data: {
        transaction: {
          status: 'paid',
          payment_customer_name: 'JOHN DOE',
        },
      },
    });

    const { result } = renderHook(() => useQrisPayment());

    await act(async () => {
      await result.current.createInvoice({
        amount: '100000',
        use_tip: 'no',
      });
    });

    // Advance timer to trigger polling
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(result.current.status).toBe('paid');
    });
  });
});
```

### Integration Test

```tsx
// src/pages/__tests__/QrisPaymentPage.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QrisPaymentPage from '../QrisPaymentPage';
import * as qrisApi from '../../api/qrisApi';

jest.mock('../../api/qrisApi');

describe('QrisPaymentPage', () => {
  it('should display QR code after invoice creation', async () => {
    (qrisApi.createQrisInvoice as jest.Mock).mockResolvedValue({
      status: 'success',
      data: {
        transaction_id: 1,
        qris_content: 'test-qris-content',
        cli_trx_number: 'TRX-001',
        remaining_time: 1800,
      },
    });

    render(<QrisPaymentPage amount={100000} />);

    await waitFor(() => {
      expect(screen.getByText('Pembayaran QRIS')).toBeInTheDocument();
    });
  });

  it('should show success screen when payment is completed', async () => {
    // ... test implementation
  });
});
```

---

## Contoh Penggunaan Lengkap

### App.tsx

```tsx
// src/App.tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import QrisPaymentPage from './pages/QrisPaymentPage';
import PaymentMethodSelection from './pages/PaymentMethodSelection';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 30000,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/payment" element={<PaymentMethodSelection />} />
            <Route 
              path="/payment/qris" 
              element={
                <QrisPaymentPage 
                  amount={150000} 
                  onSuccess={() => console.log('Payment success!')}
                />
              } 
            />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

export default App;
```

---

## Checklist Implementasi

- [ ] Setup axios instance dengan interceptors
- [ ] Implement API service functions
- [ ] Create useQrisPayment hook
- [ ] Create useQrisConfig hook
- [ ] Build QrisPaymentPage component
- [ ] Build PaymentSuccess component
- [ ] Build PaymentExpired component
- [ ] Add error handling dan error boundaries
- [ ] Implement token management
- [ ] Setup React Query untuk state management
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Test dengan berbagai skenario (success, expired, failed)
- [ ] Test responsiveness di mobile

---

## Troubleshooting

### QR Code Tidak Muncul
- Pastikan `qris_content` tidak kosong
- Check console untuk error dari library QR code
- Pastikan library `qrcode.react` terinstall

### Polling Tidak Berhenti
- Pastikan cleanup function dipanggil saat component unmount
- Check status value, polling harus stop saat `paid` atau `expired`

### CORS Error
- Pastikan backend sudah mengatur CORS untuk domain frontend
- Gunakan proxy di development (`setupProxy.js`)

### Token Expired
- Implement refresh token mechanism
- Handle 401 response di axios interceptor

---

## Support

Jika mengalami kendala, silakan hubungi:
- Email: dev@pewaca.id
- Documentation: https://docs.pewaca.id

---

*Dokumentasi ini dibuat berdasarkan implementasi QRIS payment di Pewaca Laravel/Django backend.*
*Last updated: February 2026*
