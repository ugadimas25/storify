import crypto from "crypto";

/**
 * Midtrans Payment Gateway Integration
 * 
 * Documentation: https://docs.midtrans.com
 * 
 * Flow:
 * 1. Create Snap Transaction → Get payment token & redirect URL
 * 2. User pays via Midtrans Snap page
 * 3. Midtrans sends HTTP notification to our webhook
 * 4. We verify signature and update subscription status
 */

// Midtrans API Configuration
const MIDTRANS_SANDBOX_URL = "https://app.sandbox.midtrans.com/snap/v1";
const MIDTRANS_PRODUCTION_URL = "https://app.midtrans.com/snap/v1";
const MIDTRANS_SANDBOX_API_URL = "https://api.sandbox.midtrans.com/v2";
const MIDTRANS_PRODUCTION_API_URL = "https://api.midtrans.com/v2";

function getMidtransSnapUrl(): string {
  return process.env.MIDTRANS_IS_PRODUCTION === "true"
    ? MIDTRANS_PRODUCTION_URL
    : MIDTRANS_SANDBOX_URL;
}

function getMidtransApiUrl(): string {
  return process.env.MIDTRANS_IS_PRODUCTION === "true"
    ? MIDTRANS_PRODUCTION_API_URL
    : MIDTRANS_SANDBOX_API_URL;
}

function getMidtransServerKey(): string {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) throw new Error("MIDTRANS_SERVER_KEY not configured");
  return serverKey;
}

function getMidtransClientKey(): string {
  const clientKey = process.env.MIDTRANS_CLIENT_KEY;
  if (!clientKey) throw new Error("MIDTRANS_CLIENT_KEY not configured");
  return clientKey;
}

/**
 * Generate Base64 Authorization header for Midtrans API
 * Authorization: Basic base64(ServerKey + ":")
 */
function getAuthorizationHeader(): string {
  const serverKey = getMidtransServerKey();
  const base64 = Buffer.from(serverKey + ":").toString("base64");
  return `Basic ${base64}`;
}

/**
 * Verify Midtrans notification signature
 * 
 * Signature = SHA512(order_id + status_code + gross_amount + server_key)
 */
export function verifyNotificationSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean {
  const serverKey = getMidtransServerKey();
  const signatureString = orderId + statusCode + grossAmount + serverKey;
  const expectedSignature = crypto
    .createHash("sha512")
    .update(signatureString)
    .digest("hex");
  
  return expectedSignature === signatureKey;
}

export interface MidtransCustomerDetails {
  first_name: string;
  email: string;
  phone?: string;
}

export interface MidtransItemDetails {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

export interface MidtransTransactionRequest {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  customer_details: MidtransCustomerDetails;
  item_details: MidtransItemDetails[];
  callbacks?: {
    finish?: string;
    error?: string;
    pending?: string;
  };
  custom_field1?: string; // userId
  custom_field2?: string; // planId
  custom_field3?: string; // referralCode
}

export interface MidtransSnapResponse {
  token: string;
  redirect_url: string;
}

export interface CreateMidtransSnapParams {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  itemName: string;
  itemId: string;
  userId: string;
  planId: string;
  referralCode?: string;
}

/**
 * Create Midtrans Snap Transaction
 * POST /snap/v1/transactions
 * 
 * Returns payment token and redirect URL for user to complete payment
 */
export async function createMidtransSnap(
  params: CreateMidtransSnapParams
): Promise<MidtransSnapResponse> {
  const snapUrl = getMidtransSnapUrl();
  const appUrl = process.env.APP_URL || "http://localhost:5000";

  const requestBody: MidtransTransactionRequest = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.amount,
    },
    customer_details: {
      first_name: params.customerName,
      email: params.customerEmail,
    },
    item_details: [
      {
        id: params.itemId,
        price: params.amount,
        quantity: 1,
        name: params.itemName,
      },
    ],
    callbacks: {
      finish: `${appUrl}/subscription?payment=success`,
      error: `${appUrl}/subscription?payment=failed`,
      pending: `${appUrl}/subscription?payment=pending`,
    },
    custom_field1: params.userId,
    custom_field2: params.planId,
    custom_field3: params.referralCode || "",
  };

  console.log("[Midtrans] Creating Snap transaction:", {
    orderId: params.orderId,
    amount: params.amount,
    customer: params.customerEmail,
  });

  const response = await fetch(`${snapUrl}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": getAuthorizationHeader(),
      "Accept": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Midtrans] Snap creation failed (${response.status}):`, errorText);
    throw new Error(`Failed to create Midtrans Snap transaction: ${response.status}`);
  }

  const data = await response.json();
  console.log("[Midtrans] Snap created successfully:", data.token);

  return {
    token: data.token,
    redirect_url: data.redirect_url,
  };
}

export interface MidtransTransactionStatus {
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string; // capture, settlement, pending, deny, cancel, expire, refund
  fraud_status?: string;
  status_code: string;
  signature_key: string;
  custom_field1?: string; // userId
  custom_field2?: string; // planId
  custom_field3?: string; // referralCode
}

/**
 * Check Midtrans transaction status
 * GET /v2/{order_id}/status
 * 
 * Used for polling or manual verification
 */
export async function getMidtransTransactionStatus(
  orderId: string
): Promise<MidtransTransactionStatus> {
  const apiUrl = getMidtransApiUrl();

  console.log("[Midtrans] Checking transaction status:", orderId);

  const response = await fetch(`${apiUrl}/${orderId}/status`, {
    method: "GET",
    headers: {
      "Authorization": getAuthorizationHeader(),
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Midtrans] Status check failed (${response.status}):`, errorText);
    throw new Error(`Failed to get Midtrans transaction status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Check if transaction is successful (paid)
 * 
 * Success statuses:
 * - capture (credit card)
 * - settlement (other payment methods)
 */
export function isTransactionSuccessful(status: MidtransTransactionStatus): boolean {
  return (
    (status.transaction_status === "capture" && status.fraud_status === "accept") ||
    status.transaction_status === "settlement"
  );
}

/**
 * Check if transaction is pending
 */
export function isTransactionPending(status: MidtransTransactionStatus): boolean {
  return status.transaction_status === "pending";
}

/**
 * Check if transaction failed
 */
export function isTransactionFailed(status: MidtransTransactionStatus): boolean {
  return ["deny", "cancel", "expire"].includes(status.transaction_status);
}

/**
 * Get user-friendly status message
 */
export function getStatusMessage(status: MidtransTransactionStatus): string {
  switch (status.transaction_status) {
    case "capture":
    case "settlement":
      return "Payment successful";
    case "pending":
      return "Payment pending";
    case "deny":
      return "Payment denied";
    case "cancel":
      return "Payment cancelled";
    case "expire":
      return "Payment expired";
    case "refund":
      return "Payment refunded";
    default:
      return "Unknown payment status";
  }
}

export { getMidtransServerKey, getMidtransClientKey };
