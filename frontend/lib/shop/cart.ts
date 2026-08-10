export type CartItem = {
  id: number;
  name: string;
  price: number;
  main_img: string;
  qty: number;
  stock_qty: number;
};

type CartProduct = Pick<CartItem, "id" | "name" | "price"> & {
  main_img?: string;
  stock_qty?: number;
};

export type AddToCartResult = {
  cart: CartItem[];
  addedQty: number;
  quantity: number;
  stockLimit: number;
  reachedLimit: boolean;
};

const API_BASE = "http://localhost:3001";
const GUEST_STORAGE_KEY = "realicious-guest-cart";
const LEGACY_STORAGE_KEY = "realicious-cart";
const ACTIVE_USER_KEY = "realicious-cart-active-user";
const ORDER_KEY = "realicious-last-order";
const memberSyncQueues = new Map<number, Promise<void>>();

function readCart(storageKey: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const items = JSON.parse(localStorage.getItem(storageKey) || "[]") as Partial<CartItem>[];
    if (!Array.isArray(items)) return [];

    return items
      .filter((item) => Number.isInteger(Number(item.id)) && Number(item.id) > 0)
      .map((item) => {
        const qty = Math.max(1, Number.parseInt(String(item.qty), 10) || 1);
        const rawStock = Number(item.stock_qty);
        const stockQty = Number.isInteger(rawStock) && rawStock >= 0 ? rawStock : qty;
        return {
          id: Number(item.id),
          name: String(item.name || ""),
          price: Number(item.price) || 0,
          main_img: String(item.main_img || ""),
          qty,
          stock_qty: stockQty,
        };
      });
  } catch {
    return [];
  }
}

function getGuestCart() {
  const guestCart = readCart(GUEST_STORAGE_KEY);
  if (guestCart.length > 0 || localStorage.getItem(GUEST_STORAGE_KEY) !== null) return guestCart;
  return readCart(LEGACY_STORAGE_KEY);
}

function getActiveUserId() {
  if (typeof window === "undefined") return null;
  const userId = Number(localStorage.getItem(ACTIVE_USER_KEY));
  return Number.isInteger(userId) && userId > 0 ? userId : null;
}

function getStorageKey() {
  const userId = getActiveUserId();
  return userId ? `realicious-user-${userId}-cart` : GUEST_STORAGE_KEY;
}

function getCart() {
  return getActiveUserId() ? readCart(getStorageKey()) : getGuestCart();
}

function notifyCartUpdated() {
  window.dispatchEvent(new Event("cart-updated"));
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(getStorageKey(), JSON.stringify(items));
  if (!getActiveUserId()) localStorage.removeItem(LEGACY_STORAGE_KEY);
  notifyCartUpdated();
}

async function syncRequest(path: string, options: RequestInit) {
  try {
    const response = await fetch(`${API_BASE}${path}`, options);
    if (!response.ok) throw new Error(`購物車同步失敗：${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

function syncMemberCart(userId: number, path: string, options: RequestInit) {
  const previous = memberSyncQueues.get(userId) || Promise.resolve();
  const next = previous.catch(() => {}).then(async () => {
    const data = await syncRequest(`/cart/${userId}${path}`, options);
    if (data?.success && Array.isArray(data.items)) {
      localStorage.setItem(`realicious-user-${userId}-cart`, JSON.stringify(data.items));
      if (getActiveUserId() === userId) notifyCartUpdated();
    }
  });
  memberSyncQueues.set(userId, next);
}

export async function syncCartForUser(userId: number) {
  if (typeof window === "undefined") return;
  const guestItems = getGuestCart();
  localStorage.setItem(ACTIVE_USER_KEY, String(userId));

  const data = await syncRequest(`/cart/${userId}/merge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: guestItems.map((item) => ({ product_id: item.id, qty: item.qty })),
    }),
  });

  if (data?.success && Array.isArray(data.items)) {
    localStorage.setItem(`realicious-user-${userId}-cart`, JSON.stringify(data.items));
    localStorage.removeItem(GUEST_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }
  notifyCartUpdated();
}

export function switchToGuestCart() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACTIVE_USER_KEY);
  notifyCartUpdated();
}

export function addToCart(product: CartProduct, qty: number) {
  const cart = getCart();
  const exist = cart.find((item) => item.id === product.id);
  const requestedQty = Math.max(1, Number.parseInt(String(qty), 10) || 1);
  const suppliedStock = Number(product.stock_qty);
  const stockLimit = Number.isInteger(suppliedStock) && suppliedStock >= 0
    ? suppliedStock
    : (exist?.stock_qty ?? requestedQty);
  const previousQty = exist?.qty ?? 0;
  const nextQty = Math.min(stockLimit, previousQty + requestedQty);

  if (exist) {
    exist.qty = nextQty;
    exist.stock_qty = stockLimit;
    if (product.main_img) exist.main_img = product.main_img;
  } else if (nextQty > 0) {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      main_img: product.main_img || "",
      qty: nextQty,
      stock_qty: stockLimit,
    });
  }

  saveCart(cart);
  const addedQty = Math.max(0, nextQty - Math.min(previousQty, stockLimit));
  const userId = getActiveUserId();
  if (userId && addedQty > 0) {
    syncMemberCart(userId, "/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: product.id, qty: addedQty }),
    });
  }
  return {
    cart,
    addedQty,
    quantity: nextQty,
    stockLimit,
    reachedLimit: addedQty < requestedQty,
  } satisfies AddToCartResult;
}

export function removeFromCart(productId: number) {
  const cart = getCart().filter((item) => item.id !== productId);
  saveCart(cart);
  const userId = getActiveUserId();
  if (userId) syncMemberCart(userId, `/items/${productId}`, { method: "DELETE" });
  return cart;
}

export function updateQty(productId: number, qty: number) {
  const cart = getCart();
  const item = cart.find((cartItem) => cartItem.id === productId);
  const stockLimit = item?.stock_qty ?? 1;
  const nextQty = Math.min(stockLimit, Math.max(1, qty));
  if (item) item.qty = nextQty;
  saveCart(cart);
  const userId = getActiveUserId();
  if (userId) {
    syncMemberCart(userId, `/items/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qty: nextQty }),
    });
  }
  return cart;
}

export function getCartItems(): CartItem[] {
  return getActiveUserId() ? readCart(getStorageKey()) : getGuestCart();
}

export function clearCart() {
  localStorage.removeItem(getStorageKey());
  if (!getActiveUserId()) localStorage.removeItem(LEGACY_STORAGE_KEY);
  const userId = getActiveUserId();
  if (userId) syncMemberCart(userId, "", { method: "DELETE" });
  notifyCartUpdated();
}

export function removePurchasedCartItems(productIds: number[]) {
  const ids = new Set(productIds);
  if (ids.size === 0) return getCart();

  const cart = getCart().filter((item) => !ids.has(item.id));
  saveCart(cart);

  const userId = getActiveUserId();
  if (userId) {
    for (const productId of ids) {
      void syncRequest(`/cart/${userId}/items/${productId}`, { method: "DELETE" });
    }
  }
  return cart;
}

export function saveLastOrder(items: CartItem[]) {
  localStorage.setItem(ORDER_KEY, JSON.stringify({ items, date: Date.now() }));
}

export function getLastOrder(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const data = JSON.parse(localStorage.getItem(ORDER_KEY) || "null");
    return data?.items || [];
  } catch {
    return [];
  }
}
