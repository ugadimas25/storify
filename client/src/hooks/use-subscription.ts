import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
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
      const res = await fetch(`/api/listening/status?${params.toString()}`, {
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
      const res = await fetch("/api/listening/record", {
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
      const res = await fetch("/api/subscription/plans");
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
      const res = await fetch("/api/subscription/active", {
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
      const res = await fetch("/api/payment/create", {
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
      const res = await fetch(`/api/payment/${transactionId}`);
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
    mutationFn: async ({ transactionId, status, paymentCustomerName, xenditPaymentMethod, xenditPaymentChannel }: {
      transactionId: number;
      status: string;
      paymentCustomerName?: string;
      xenditPaymentMethod?: string;
      xenditPaymentChannel?: string;
    }) => {
      const res = await fetch(`/api/payment/${transactionId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, paymentCustomerName, xenditPaymentMethod, xenditPaymentChannel }),
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
