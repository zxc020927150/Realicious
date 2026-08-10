import Cookies from "js-cookie";

const API_BASE = "http://localhost:3001";

async function pay(method: string, orderId: number) {
  const token = Cookies.get("token");
  const res = await fetch(`${API_BASE}/payment/pay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ method, orderId }),
  });
  return res.json();
}

// ── 策略模式：付款方法物件 ──
export const paymentMethods = {
  ecpay: {
    id: "ecpay",
    label: "線上刷卡",
    icon: "credit-card",
    async checkout(orderId: number) {
      const data = await pay("ecpay", orderId);
      if (!data.success) throw new Error(data.error || "ECPay 付款失敗");
      const form = document.createElement("form");
      form.method = data.method;
      form.action = data.action;
      for (const [key, val] of Object.entries(data.params as Record<string, string>)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = val;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    },
  },

  linepay: {
    id: "linepay",
    label: "行動支付",
    icon: "smartphone",
    async checkout(orderId: number) {
      const data = await pay("linepay", orderId);
      if (!data.success) throw new Error(data.error || "LINE Pay 付款失敗");
      window.location.href = data.action;
    },
  },

  mock: {
    id: "mock",
    label: "模擬付款（測試用）",
    icon: "test-tube",
    async checkout(orderId: number) {
      const data = await pay("mock", orderId);
      if (!data.success) throw new Error(data.error || "模擬付款失敗");
    },
  },
};

export type PaymentMethod = keyof typeof paymentMethods;
