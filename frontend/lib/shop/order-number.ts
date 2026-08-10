export function formatOrderNumber(orderId: number | string) {
  const value = String(orderId).trim();
  return value ? `ORD-${value.padStart(6, "0")}` : "ORD-未取得";
}
