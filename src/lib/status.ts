import type { OrderStatus } from "@/db/schema";

export const statusLabels: Record<OrderStatus, string> = {
  QUOTE_CREATED: "Quote Created",
  PAYMENT_VERIFICATION_PENDING: "Payment Verification",
  PAID: "Paid",
  PRINTING: "Printing",
  READY_FOR_PICKUP: "Ready For Pickup",
  COMPLETED: "Completed",
  PAYMENT_REJECTED: "Rejected"
};

export const adminStatuses: OrderStatus[] = [
  "PAYMENT_VERIFICATION_PENDING",
  "PAID",
  "PRINTING",
  "READY_FOR_PICKUP",
  "COMPLETED",
  "PAYMENT_REJECTED"
];

export const allowedTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PAYMENT_VERIFICATION_PENDING: ["PAID", "PAYMENT_REJECTED"],
  PAID: ["PRINTING"],
  PRINTING: ["READY_FOR_PICKUP"],
  READY_FOR_PICKUP: ["COMPLETED"]
};

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return allowedTransitions[from]?.includes(to) ?? false;
}
