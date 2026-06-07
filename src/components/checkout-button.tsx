"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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
      className="w-full sm:w-auto min-w-[200px]" 
      onClick={handlePaymentInitiation}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Redirecting...
        </>
      ) : (
        "Pay Securely via PhonePe"
      )}
    </Button>
  );
}
