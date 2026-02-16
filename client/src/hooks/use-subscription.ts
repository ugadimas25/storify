import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { apiUrl } from "@/lib/api-config";
import type { SubscriptionPlan, Subscription, PaymentTransaction } from "@shared/schema";

// Get or create visitor ID for guest users
export function getVisitorId(): string {
  let visitorId = localStorage.getItem("storify_visitor_id");
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem("storify_visitor_id", visitorId);
  }
  return visitorId;
}

export interface ListeningStatus {
  canListen: boolean;
  listenCount: number;
  limit: number | null;
  hasSubscription: boolean;
  subscriptionEndsAt: Date | null;
  reason: string | null;
}

// Fetch listening status
export function useListeningStatus() {
  const { user } = useAuth();
  const visitorId = getVisitorId();

  return useQuery<ListeningStatus>({
    queryKey: ["listening-status", user?.id || visitorId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (!user) {
        params.append("visitorId", visitorId);
      }
      const res = await fetch(apiUrl(`/api/listening/status?${params.toString()}`), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch listening status");
      return res.json();
    },
    staleTime: 30000, // 30 seconds
  });
}

// Record listening action
export function useRecordListening() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const visitorId = getVisitorId();

  return useMutation({
    mutationFn: async (bookId: number) => {
      const res = await fetch(apiUrl("/api/listening/record"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          bookId,
          visitorId: user ? undefined : visitorId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to record listening");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listening-status"] });
    },
  });
}

// Fetch subscription plans
export function useSubscriptionPlans() {
  return useQuery<SubscriptionPlan[]>({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/api/subscription/plans"));
      if (!res.ok) throw new Error("Failed to fetch plans");
      return res.json();
    },
  });
}

// Fetch active subscription
export function useActiveSubscription() {
  const { user } = useAuth();

  return useQuery<Subscription | null>({
    queryKey: ["active-subscription", user?.id],
    queryFn: async () => {
      const res = await fetch(apiUrl("/api/subscription/active"), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch subscription");
      return res.json();
    },
    enabled: !!user,
  });
}

// Create payment transaction
export function useCreatePayment() {
  return useMutation({
    mutationFn: async (planId: number) => {
      const res = await fetch(apiUrl("/api/payment/create"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create payment");
      }
      return data as PaymentTransaction;
    },
  });
}

// Get payment status
export function usePaymentStatus(transactionId: number | null, enabled: boolean = true) {
  return useQuery<PaymentTransaction>({
    queryKey: ["payment-status", transactionId],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/payment/${transactionId}`));
      if (!res.ok) throw new Error("Failed to fetch payment status");
      return res.json();
    },
    enabled: !!transactionId && enabled,
    refetchInterval: enabled ? 5000 : false, // Poll every 5 seconds if enabled
  });
}

// Update payment status (for webhook/callback simulation)
export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transactionId, status, paymentCustomerName, dokuPaymentMethod, dokuPaymentChannel }: {
      transactionId: number;
      status: string;
      paymentCustomerName?: string;
      dokuPaymentMethod?: string;
      dokuPaymentChannel?: string;
    }) => {
      const res = await fetch(apiUrl(`/api/payment/${transactionId}/update`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, paymentCustomerName, dokuPaymentMethod, dokuPaymentChannel }),
      });
      if (!res.ok) throw new Error("Failed to update payment");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["payment-status"] });
      queryClient.invalidateQueries({ queryKey: ["active-subscription"] });
      queryClient.invalidateQueries({ queryKey: ["listening-status"] });
    },
  });
}

// ============= QRIS PAYMENT (Django Storify-Subscription API) =============

// QRIS transaction type (from Django API via proxy)
export interface QrisTransaction {
  id: string; // UUID
  plan: {
    id: number;
    name: string;
    price: number;
    durationDays: number;
    description: string;
    isActive: boolean;
  };
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

export interface QrisPlan {
  id: number;
  name: string;
  price: number;
  durationDays: number;
  description: string;
  isActive: boolean;
}

export interface QrisSubscription {
  id: number;
  plan: QrisPlan;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
}

// Fetch QRIS subscription plans (from Django API)
export function useQrisPlans() {
  return useQuery<QrisPlan[]>({
    queryKey: ["qris-plans"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/api/qris/plans"));
      if (!res.ok) throw new Error("Failed to fetch QRIS plans");
      return res.json();
    },
  });
}

// Fetch QRIS active subscription (from Django API)
export function useQrisActiveSubscription() {
  const { user } = useAuth();

  return useQuery<QrisSubscription | null>({
    queryKey: ["qris-active-subscription", user?.id],
    queryFn: async () => {
      const res = await fetch(apiUrl("/api/qris/subscription/active"), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch QRIS subscription");
      return res.json();
    },
    enabled: !!user,
  });
}

// Create QRIS payment transaction (via Django API)
export function useCreateQrisPayment() {
  return useMutation({
    mutationFn: async (planId: number) => {
      const res = await fetch(apiUrl("/api/qris/payment/create"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create QRIS payment");
      }
      return data as QrisTransaction;
    },
  });
}

// Get QRIS payment status (polling every 3 seconds per guide spec)
export function useQrisPaymentStatus(transactionId: string | null, enabled: boolean = true) {
  return useQuery<QrisTransaction>({
    queryKey: ["qris-payment-status", transactionId],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/qris/payment/${transactionId}`), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch QRIS payment status");
      return res.json();
    },
    enabled: !!transactionId && enabled,
    refetchInterval: enabled ? 3000 : false, // Poll every 3 seconds (per QRIS guide)
  });
}
