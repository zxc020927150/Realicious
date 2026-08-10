import {
  removePurchasedCartItems,
  saveLastOrder,
  type CartItem,
} from "./cart";

const CHECKOUT_STORAGE_KEY = "realicious-checkout-session";

export type CheckoutSource = "cart" | "buy-now";

export type CheckoutSession = {
  source: CheckoutSource;
  items: CartItem[];
  createdAt: number;
};

function notifyCheckoutUpdated() {
  window.dispatchEvent(new Event("checkout-session-updated"));
}

export function startCheckout(source: CheckoutSource, items: CartItem[]) {
  if (typeof window === "undefined" || items.length === 0) return;
  const session: CheckoutSession = {
    source,
    items,
    createdAt: Date.now(),
  };
  sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(session));
  notifyCheckoutUpdated();
}

export function getCheckoutSession(): CheckoutSession | null {
  if (typeof window === "undefined") return null;

  try {
    const session = JSON.parse(
      sessionStorage.getItem(CHECKOUT_STORAGE_KEY) || "null",
    ) as CheckoutSession | null;

    if (
      !session
      || !["cart", "buy-now"].includes(session.source)
      || !Array.isArray(session.items)
      || session.items.length === 0
    ) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function getCheckoutItems() {
  return getCheckoutSession()?.items || [];
}

export function clearCheckoutSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
  notifyCheckoutUpdated();
}

export function completeCheckoutSession() {
  const session = getCheckoutSession();
  if (!session) return [];

  if (session.source === "cart") {
    removePurchasedCartItems(session.items.map((item) => item.id));
  }
  saveLastOrder(session.items);
  clearCheckoutSession();
  return session.items;
}
