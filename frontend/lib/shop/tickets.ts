const API_BASE = "http://localhost:3001";

export type Ticket = {
  id: number;
  user_id: number;
  product_id: number | null;
  order_id: number | null;
  redeem_code: string | null;
  name: string;
  type: "product" | "discount" | "cash";
  status: number; // 1:未使用 2:已使用 3:已過期
  discount_value: number;
  min_purchase: number;
  used_at: string | null;
  expires_at: string | null;
  created_at: string;
  product_name: string | null;
  product_price: number | null;
  product_img: string | null;
};

export function isTicketExpired(ticket: Ticket, now = Date.now()) {
  if (ticket.status === 3) return true;
  return ticket.status === 1 && Boolean(
    ticket.expires_at && new Date(ticket.expires_at).getTime() < now,
  );
}

export function isTicketUsable(ticket: Ticket, now = Date.now()) {
  return ticket.status === 1 && !isTicketExpired(ticket, now);
}

export async function getTickets(userId: number) {
  const res = await fetch(`${API_BASE}/tickets?user_id=${userId}`);
  return res.json();
}
