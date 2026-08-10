import Cookies from "js-cookie";

const API_BASE = "http://localhost:3001";

export type OrderContact = {
  name: string;
  email: string;
  phone: string;
  city: string;
  district: string;
  address: string;
};

export type OrderContactErrors = Partial<Record<keyof OrderContact, string>>;

const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} .·・'’\-]*$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TAIWAN_MOBILE_PATTERN = /^09\d{8}$/;

export function normalizeTaiwanMobile(phone: string) {
  const compactPhone = phone.trim().replace(/[\s-]/g, "");
  return compactPhone.startsWith("+886")
    ? `0${compactPhone.slice(4)}`
    : compactPhone;
}

export function validateOrderContact(contact: OrderContact): OrderContactErrors {
  const errors: OrderContactErrors = {};
  const name = contact.name.trim();
  const nameLength = Array.from(name).length;
  const email = contact.email.trim();
  const phone = contact.phone.trim().replace(/[\s-]/g, "");

  if (!name) {
    errors.name = "請填寫收件人姓名";
  } else if (nameLength < 2 || nameLength > 50) {
    errors.name = "姓名長度需為 2–50 個字元";
  } else if (!NAME_PATTERN.test(name)) {
    errors.name = "姓名僅能使用中文、外文字母、空格、連字號或撇號";
  }

  if (!email) {
    errors.email = "請填寫電子郵件";
  } else if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    errors.email = "請輸入有效的電子郵件格式";
  }

  if (!phone) {
    errors.phone = "請填寫手機號碼";
  } else if (!TAIWAN_MOBILE_PATTERN.test(phone)) {
    errors.phone = "請輸入 09 開頭的 10 碼手機號碼";
  }

  if (!contact.city.trim()) errors.city = "請選擇縣市";
  if (!contact.district.trim()) errors.district = "請選擇鄉鎮區";

  const address = contact.address.trim();
  const addressLength = Array.from(address).length;
  const containsLetter = /\p{L}/u.test(address);
  if (!address) {
    errors.address = "請填寫詳細地址";
  } else if (addressLength < 5) {
    errors.address = "詳細地址至少需要 5 個字元";
  } else if (!containsLetter) {
    errors.address = "詳細地址需包含路名或地名，不能只有數字";
  } else if (addressLength > 100) {
    errors.address = "詳細地址請勿超過 100 個字元";
  }

  return errors;
}

export function formatOrderAddress(contact: OrderContact) {
  return [contact.city, contact.district, contact.address]
    .map((part) => part.trim())
    .filter(Boolean)
    .join("");
}

export async function createOrder(
  items: { id: number; name: string; price: number; qty: number }[],
  contact: OrderContact,
) {
  const token = Cookies.get("token");
  const res = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      items,
      address: formatOrderAddress(contact),
      recipient_name: contact.name.trim(),
      recipient_email: contact.email.trim(),
      recipient_phone: normalizeTaiwanMobile(contact.phone),
    }),
  });
  return res.json();
}

export type Order = {
  id: number;
  user_id: number;
  status: number | string;
  created_at: string;
  user_name: string;
  total_price: number;
};

export type OrderItem = {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  product_name: string;
  is_active?: number | boolean | null;
};

export async function getOrders(userId?: number) {
  const url = userId ? `${API_BASE}/orders?user_id=${userId}` : `${API_BASE}/orders`;
  const res = await fetch(url);
  return res.json();
}

export async function getOrderDetail(orderId: number) {
  const res = await fetch(`${API_BASE}/orders/detail/${orderId}`);
  return res.json();
}
