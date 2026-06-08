"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function RealtimeOrders({ 
  orderId, 
  strategy = "websocket",
  intervalMs = 5000 
}: { 
  orderId?: string; 
  strategy?: "websocket" | "polling";
  intervalMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    if (strategy === "polling") {
      const intervalId = setInterval(() => {
        router.refresh();
      }, intervalMs);
      return () => clearInterval(intervalId);
    }

    const supabase = createSupabaseBrowserClient();

    // Admin dashboard: Listen to all orders via secure Postgres Changes
    if (!orderId) {
      const channel = supabase
        .channel("realtime-orders-all")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders" },
          () => router.refresh()
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }

    // Public Tracking Page: Listen to specific order via unguessable UUID Broadcast channel
    const channel = supabase
      .channel(`realtime-order-${orderId}`)
      .on(
        "broadcast",
        { event: "status_update" },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, orderId, strategy, intervalMs]);

  return null;
}
