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
      // Safe HTTP short-polling for public/anonymous pages to avoid RLS security risks
      const intervalId = setInterval(() => {
        router.refresh();
      }, intervalMs);
      return () => clearInterval(intervalId);
    }

    // WebSocket real-time for authenticated admins
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(orderId ? `realtime-order-${orderId}` : "realtime-orders-all")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: orderId ? `id=eq.${orderId}` : undefined,
        },
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
