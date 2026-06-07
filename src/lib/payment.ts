export function createUpiPaymentLink(input: { upiId: string; shopName: string; amount: number; note?: string }) {
  const params = new URLSearchParams({
    pa: input.upiId,
    pn: input.shopName,
    am: input.amount.toFixed(2),
    cu: "INR"
  });

  if (input.note) params.set("tn", input.note);

  return `upi://pay?${params.toString()}`;
}
