import { useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "./use-auth";

// Fire-and-forget activity logger
function sendActivity(action: string, resourceType?: string, resourceId?: string, metadata?: Record<string, any>) {
  fetch("/api/activity/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ action, resourceType, resourceId, metadata }),
  }).catch(() => {}); // silent fail
}

/**
 * Hook to automatically log page views for authenticated users.
 * Place once in App.tsx or a layout component.
 */
export function usePageViewTracker() {
  const { user } = useAuth();
  const [location] = useLocation();

  useEffect(() => {
    if (!user) return;
    sendActivity("page_view", "page", location, { path: location });
  }, [location, user]);
}

/**
 * Manual activity logger for specific actions (search, etc.)
 */
export function useActivityLogger() {
  const { user } = useAuth();

  const log = useCallback(
    (action: string, resourceType?: string, resourceId?: string, metadata?: Record<string, any>) => {
      if (!user) return;
      sendActivity(action, resourceType, resourceId, metadata);
    },
    [user]
  );

  return { logActivity: log };
}
