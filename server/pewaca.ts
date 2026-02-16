/**
 * Storify QRIS Subscription API Integration
 * Base URL: https://admin-v2.pewaca.id/api/storify-subscription
 * 
 * Django backend that handles subscription plans, QRIS payment,
 * listening limits, and subscription management.
 * 
 * Auth: JWT login via /api/auth/login/ with PEWACA_EMAIL & PEWACA_PASSWORD.
 * Token is cached in memory and auto-refreshed when expired.
 */

const PEWACA_BASE = "https://admin-v2.pewaca.id";
const QRIS_API_BASE = `${PEWACA_BASE}/api/storify-subscription`;

// ============= JWT Token Cache =============
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0; // Unix timestamp in seconds

/**
 * Login to Pewaca Django API and get JWT access token.
 * Caches the token in memory for reuse.
 */
async function loginAndGetToken(): Promise<string> {
  const email = process.env.PEWACA_EMAIL;
  const password = process.env.PEWACA_PASSWORD;

  if (!email || !password) {
    throw new Error("PEWACA_EMAIL and PEWACA_PASSWORD must be set in .env");
  }

  console.log("[Pewaca] Logging in to get JWT token...");

  const response = await fetch(`${PEWACA_BASE}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pewaca login failed (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const token = result?.data?.token;

  if (!token) {
    throw new Error("Pewaca login response missing token");
  }

  // Decode JWT to get expiration (payload is base64url)
  try {
    const payloadB64 = token.split(".")[1];
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    // Refresh 5 minutes before actual expiry
    tokenExpiresAt = (payload.exp || 0) - 300;
  } catch {
    // If decode fails, cache for 1 hour
    tokenExpiresAt = Math.floor(Date.now() / 1000) + 3600;
  }

  cachedToken = token;
  console.log("[Pewaca] JWT token obtained, expires at", new Date(tokenExpiresAt * 1000).toISOString());
  return token;
}

/**
 * Get a valid JWT token (from cache or fresh login).
 */
async function getToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }
  return loginAndGetToken();
}

/**
 * Build auth headers with cached JWT token.
 */
async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
}

// ============= Type definitions (Django snake_case → camelCase) =============

export interface QrisPlan {
  id: number;
  name: string;
  price: number;
  durationDays: number;
  description: string;
  isActive: boolean;
}

export interface QrisTransaction {
  id: string; // UUID
  plan: QrisPlan;
  amount: number;
  status: "pending" | "paid" | "expired" | "failed";
  qrisContent: string;
  qrisInvoiceId: string;
  transactionNumber: string;
  expiredAt: string;
  paidAt: string | null;
  paymentCustomerName: string;
  paymentMethodBy: string;
  createdAt: string;
}

export interface QrisSubscription {
  id: number;
  plan: QrisPlan;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
}

export interface QrisListeningStatus {
  canListen: boolean;
  listenCount: number;
  limit: number | null;
  hasSubscription: boolean;
  subscriptionEndsAt: string | null;
  reason: string | null;
}

// ============= Helper: transform Django snake_case → camelCase =============

function transformPlan(raw: any): QrisPlan {
  return {
    id: raw.id,
    name: raw.name,
    price: raw.price,
    durationDays: raw.duration_days,
    description: raw.description || "",
    isActive: raw.is_active,
  };
}

function transformTransaction(raw: any): QrisTransaction {
  return {
    id: raw.id,
    plan: raw.plan ? transformPlan(raw.plan) : raw.plan,
    amount: raw.amount,
    status: raw.status,
    qrisContent: raw.qris_content || "",
    qrisInvoiceId: raw.qris_invoice_id || "",
    transactionNumber: raw.transaction_number || "",
    expiredAt: raw.expired_at || "",
    paidAt: raw.paid_at || null,
    paymentCustomerName: raw.payment_customer_name || "",
    paymentMethodBy: raw.payment_method_by || "",
    createdAt: raw.created_at || "",
  };
}

function transformSubscription(raw: any): QrisSubscription | null {
  if (!raw) return null;
  return {
    id: raw.id,
    plan: raw.plan ? transformPlan(raw.plan) : raw.plan,
    startDate: raw.start_date,
    endDate: raw.end_date,
    status: raw.status,
    createdAt: raw.created_at,
  };
}

function transformListeningStatus(raw: any): QrisListeningStatus {
  return {
    canListen: raw.can_listen,
    listenCount: raw.listen_count,
    limit: raw.limit,
    hasSubscription: raw.has_subscription,
    subscriptionEndsAt: raw.subscription_ends_at || null,
    reason: raw.reason || null,
  };
}

// ============= API Functions =============

/**
 * GET /api/storify-subscription/plans/
 * Fetch available subscription plans
 */
export async function fetchQrisPlans(): Promise<QrisPlan[]> {
  const url = `${QRIS_API_BASE}/plans/`;
  const headers = await authHeaders();

  const response = await fetch(url, {
    method: "GET",
    headers,
    redirect: "follow",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch QRIS plans (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return (data as any[]).map(transformPlan);
}

/**
 * POST /api/storify-subscription/payment/create/
 * Create QRIS payment transaction (generates QR code)
 * Passes Storify user info so Django can create/find StorifyUser.
 */
export async function createQrisPayment(
  planId: number,
  userInfo: { email: string; name: string; storifyUserId: string }
): Promise<QrisTransaction> {
  const url = `${QRIS_API_BASE}/payment/create/`;
  const headers = await authHeaders();

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      plan_id: planId,
      user_email: userInfo.email,
      user_name: userInfo.name,
      storify_user_id: userInfo.storifyUserId,
    }),
    redirect: "follow",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create QRIS payment (${response.status})`);
  }

  const data = await response.json();
  return transformTransaction(data);
}

/**
 * GET /api/storify-subscription/payment/{transaction_id}/
 * Check QRIS payment status (used for polling)
 */
export async function checkQrisPaymentStatus(transactionId: string): Promise<QrisTransaction> {
  const url = `${QRIS_API_BASE}/payment/${transactionId}/`;
  const headers = await authHeaders();

  const response = await fetch(url, {
    method: "GET",
    headers,
    redirect: "follow",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to check QRIS status (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return transformTransaction(data);
}

/**
 * GET /api/storify-subscription/active/
 * Get active QRIS subscription for a Storify user
 */
export async function fetchQrisActiveSubscription(
  storifyUserId: string
): Promise<QrisSubscription | null> {
  const url = `${QRIS_API_BASE}/active/?storify_user_id=${encodeURIComponent(storifyUserId)}`;
  const headers = await authHeaders();

  const response = await fetch(url, {
    method: "GET",
    headers,
    redirect: "follow",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch QRIS subscription (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return transformSubscription(data);
}

/**
 * GET /api/storify-subscription/listening/status/?visitor_id=xxx
 * Check listening status / limits
 */
export async function fetchQrisListeningStatus(
  visitorId?: string
): Promise<QrisListeningStatus> {
  const params = visitorId ? `?visitor_id=${visitorId}` : "";
  const url = `${QRIS_API_BASE}/listening/status/${params}`;
  const headers = await authHeaders();

  const response = await fetch(url, {
    method: "GET",
    headers,
    redirect: "follow",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch listening status (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return transformListeningStatus(data);
}

/**
 * POST /api/storify-subscription/listening/record/
 * Record that user started listening to a book
 */
export async function recordQrisListening(
  bookId: number,
  visitorId?: string
): Promise<any> {
  const url = `${QRIS_API_BASE}/listening/record/`;
  const headers = await authHeaders();

  const body: any = { book_id: bookId };
  if (visitorId) body.visitor_id = visitorId;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    redirect: "follow",
  });

  if (response.status === 403) {
    const data = await response.json();
    throw new Error(data.message || "Listening limit reached");
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to record listening (${response.status}): ${errorText}`);
  }

  return response.json();
}
