import crypto from "crypto";

// DOKU API Configuration
const DOKU_SANDBOX_URL = "https://api-sandbox.doku.com";
const DOKU_PRODUCTION_URL = "https://api.doku.com";

function getDokuBaseUrl(): string {
  return process.env.NODE_ENV === "production"
    ? DOKU_PRODUCTION_URL
    : DOKU_SANDBOX_URL;
}

function getDokuClientId(): string {
  const clientId = process.env.DOKU_CLIENT_ID;
  if (!clientId) throw new Error("DOKU_CLIENT_ID not configured");
  return clientId;
}

function getDokuSecretKey(): string {
  const secretKey = process.env.DOKU_SECRET_KEY;
  if (!secretKey) throw new Error("DOKU_SECRET_KEY not configured");
  return secretKey;
}

/**
 * Generate DOKU Signature for API requests
 * 
 * Signature components:
 *   Client-Id + "\n" + Request-Id + "\n" + Request-Timestamp + "\n" + Request-Target + "\n" + Digest
 * 
 * Digest = SHA-256(requestBody) → base64
 * Signature = HMAC-SHA256(componentString, SecretKey) → base64
 */
function generateDigest(requestBody: string): string {
  return crypto.createHash("sha256").update(requestBody).digest("base64");
}

function generateSignature(
  clientId: string,
  requestId: string,
  requestTimestamp: string,
  requestTarget: string,
  digest: string,
  secretKey: string
): string {
  const componentString = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${requestTimestamp}\nRequest-Target:${requestTarget}\nDigest:${digest}`;
  
  const hmac = crypto
    .createHmac("sha256", secretKey)
    .update(componentString)
    .digest("base64");
  
  return `HMACSHA256=${hmac}`;
}

/**
 * Generate signature for verifying DOKU HTTP Notification
 * 
 * Notification signature components:
 *   Client-Id + "\n" + Request-Id + "\n" + Request-Timestamp + "\n" + Request-Target + "\n" + Digest
 */
export function verifyNotificationSignature(
  clientId: string,
  requestId: string,
  requestTimestamp: string,
  requestTarget: string,
  requestBody: string,
  signatureHeader: string
): boolean {
  const digest = generateDigest(requestBody);
  const secretKey = getDokuSecretKey();
  
  const expectedSignature = generateSignature(
    clientId,
    requestId,
    requestTimestamp,
    requestTarget,
    digest,
    secretKey
  );
  
  return expectedSignature === signatureHeader;
}

export interface DokuCheckoutRequest {
  invoiceNumber: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  itemName: string;
  paymentDueMinutes?: number;
  callbackUrl?: string;
  callbackUrlCancel?: string;
}

export interface DokuCheckoutResponse {
  message: string[];
  response: {
    order: {
      amount: string;
      invoice_number: string;
      currency: string;
      session_id: string;
    };
    payment: {
      token_id: string;
      url: string;
      expired_date: string;
      payment_due_date: number;
    };
  };
}

/**
 * Create a DOKU Checkout payment
 * POST /checkout/v1/payment
 */
export async function createDokuCheckout(
  params: DokuCheckoutRequest
): Promise<DokuCheckoutResponse> {
  const clientId = getDokuClientId();
  const secretKey = getDokuSecretKey();
  const baseUrl = getDokuBaseUrl();

  const requestId = crypto.randomUUID();
  const requestTimestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const requestTarget = "/checkout/v1/payment";

  const appUrl = process.env.APP_URL || "http://localhost:5000";

  const requestBody = JSON.stringify({
    order: {
      amount: params.amount,
      invoice_number: params.invoiceNumber,
      currency: "IDR",
      callback_url: params.callbackUrl || `${appUrl}/subscription?payment=success`,
      callback_url_cancel: params.callbackUrlCancel || `${appUrl}/subscription?payment=cancelled`,
      language: "ID",
      auto_redirect: true,
      disable_retry_payment: false,
      line_items: [
        {
          name: params.itemName,
          quantity: 1,
          price: params.amount,
        },
      ],
    },
    payment: {
      payment_due_date: params.paymentDueMinutes || 60, // Default 60 minutes
      payment_method_types: [
        "QRIS",
        "VIRTUAL_ACCOUNT_BCA",
        "VIRTUAL_ACCOUNT_BANK_MANDIRI",
        "VIRTUAL_ACCOUNT_BRI",
        "VIRTUAL_ACCOUNT_BNI",
        "VIRTUAL_ACCOUNT_DOKU",
        "EMONEY_SHOPEE_PAY",
        "EMONEY_OVO",
      ],
    },
    customer: {
      name: params.customerName,
      email: params.customerEmail,
    },
  });

  const digest = generateDigest(requestBody);
  const signature = generateSignature(
    clientId,
    requestId,
    requestTimestamp,
    requestTarget,
    digest,
    secretKey
  );

  console.log("[DOKU] Creating checkout payment:", {
    invoiceNumber: params.invoiceNumber,
    amount: params.amount,
    url: `${baseUrl}${requestTarget}`,
  });

  const response = await fetch(`${baseUrl}${requestTarget}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Id": clientId,
      "Request-Id": requestId,
      "Request-Timestamp": requestTimestamp,
      Signature: signature,
    },
    body: requestBody,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("[DOKU] Checkout creation failed:", data);
    throw new Error(
      data.error?.message ||
        data.message?.[0] ||
        `DOKU API error: ${response.status}`
    );
  }

  console.log("[DOKU] Checkout created successfully:", {
    paymentUrl: data.response?.payment?.url,
    expiredDate: data.response?.payment?.expired_date,
    sessionId: data.response?.order?.session_id,
  });

  return {
    ...data,
    _requestId: requestId,
  } as DokuCheckoutResponse & { _requestId: string };
}
