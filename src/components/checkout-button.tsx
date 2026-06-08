"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";

export function CheckoutButton({ orderId, token }: { orderId: string; token: string }) {
  const [loading, setLoading] = useState(false);

  const handlePaymentInitiation = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/payment/phonepe/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, token }),
      });

      const data = await res.json();

      if (res.ok && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        alert("Failed to initiate payment: " + (data.error || "Unknown error"));
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong while initiating payment.");
      setLoading(false);
    }
  };

  return (
    <Button
      variant="secondary"
      size="lg"
      className="w-full"
      onClick={handlePaymentInitiation}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Redirecting…
        </>
      ) : (
        <>
          <CreditCard className="h-5 w-5" />
          Pay Securely via PhonePe
        </>
      )}
    </Button>
  );
}
