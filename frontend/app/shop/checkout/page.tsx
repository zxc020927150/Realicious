"use client";
import React, { useEffect, useSyncExternalStore, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Breadcrumbs from "../_components/Breadcrumbs";
import CheckoutContactInfo from "./_components/CheckoutContactInfo";
import CheckoutOrderList from "./_components/CheckoutOrderList";
import CheckoutSummary from "./_components/CheckoutSummary";
import type { CartItem } from "@/lib/shop/cart";
import { getCheckoutItems } from "@/lib/shop/checkout";
import {
  createOrder,
  type OrderContact,
  validateOrderContact,
} from "@/lib/shop/orders";
import { useUser } from "@/app/context/user";
import PaymentMethodDialog from "../_components/PaymentMethodDialog";
import { useToast } from "@/app/context/toast";

const EMPTY: CartItem[] = [];
let cached = EMPTY;

function subscribe(cb: () => void) {
  window.addEventListener("checkout-session-updated", cb);
  window.addEventListener("pageshow", cb);
  return () => {
    window.removeEventListener("checkout-session-updated", cb);
    window.removeEventListener("pageshow", cb);
  };
}

function getSnapshot() {
  const latest = getCheckoutItems();
  if (latest.length === 0 && cached.length === 0) return cached;
  if (latest.length !== cached.length) { cached = latest; return cached; }
  for (let i = 0; i < latest.length; i++) {
    if (
      latest[i].id !== cached[i].id
      || latest[i].qty !== cached[i].qty
      || latest[i].stock_qty !== cached[i].stock_qty
    ) {
      cached = latest;
      return cached;
    }
  }
  return cached;
}

function getServerSnapshot() {
  return EMPTY;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const { showToast } = useToast();
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [showPayment, setShowPayment] = useState(false);
  const [contact, setContact] = useState<OrderContact>({
    name: "",
    email: "",
    phone: "",
    city: "",
    district: "",
    address: "",
  });
  const [contactValidationRequest, setContactValidationRequest] = useState(0);
  const [contactIsEditing, setContactIsEditing] = useState(false);

  useEffect(() => {
    if (!loading && !user?.id) {
      router.replace("/user/login?next=/shop/checkout");
    }
  }, [loading, router, user?.id]);

  const createPendingOrder = async (): Promise<number | null> => {
    if (contactIsEditing) {
      showToast("請先完成聯絡資訊修改");
      setShowPayment(false);
      return null;
    }

    if (Object.keys(validateOrderContact(contact)).length > 0) {
      setContactValidationRequest((value) => value + 1);
      setShowPayment(false);
      return null;
    }

    const order = await createOrder(items, contact);
    if (!order.success) {
      alert(order.error || "訂單建立失敗");
      return null;
    }

    return order.orderId;
  };

  const handleCheckout = () => {
    if (contactIsEditing) {
      showToast("請先完成聯絡資訊修改");
      requestAnimationFrame(() => {
        document
          .getElementById("checkout-contact-info")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }

    if (Object.keys(validateOrderContact(contact)).length > 0) {
      setContactValidationRequest((value) => value + 1);
      requestAnimationFrame(() => {
        document
          .getElementById("checkout-contact-info")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }

    setShowPayment(true);
  };

  if (loading || !user?.id) {
    return <div className="min-h-screen" />;
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center gap-5 px-4 text-center text-[#3D2419]">
        <h1 className="text-3xl font-black">尚未選擇結帳商品</h1>
        <p className="text-[#3D2419]/65">請回購物車勾選商品，或在商品頁使用「立即購買」。</p>
        <Link
          href="/shop/cart"
          className="border-[3px] border-[#3D2419] bg-[#FFD45C] px-6 py-3 font-bold shadow-[4px_4px_0px_0px_#3D2419]"
        >
          返回購物車
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen scroll-smooth">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 pt-4">
          <Link
            href="/shop/cart"
            className="inline-flex items-center gap-2 border-2 border-[#3D2419] bg-[#FFD45C] px-3 py-2 text-sm font-bold text-[#3D2419] shadow-[2px_2px_0px_0px_#3D2419] sm:hidden"
          >
            ← 返回購物車
          </Link>
          <div className="hidden sm:block">
            <Breadcrumbs items={[
              { label: "首頁", href: "/" },
              { label: "商品列表", href: "/shop" },
              { label: "購物車", href: "/shop/cart" },
              { label: "結帳" }
            ]} />
          </div>
        </div>
        <div className="flex min-h-[calc(100vh-7rem)] flex-col gap-6 pb-16 md:pb-24 lg:flex-row lg:gap-8">
          <div className="w-full lg:w-[60%]">
            <div className="mb-6">
              <CheckoutContactInfo
                defaultEmail={user?.account}
                onContactChange={setContact}
                onEditingChange={setContactIsEditing}
                validationRequest={contactValidationRequest}
              />
            </div>
            <div className="mb-6">
              <CheckoutOrderList items={items} />
            </div>
          </div>
          <div className="w-full self-start lg:sticky lg:top-[76px] lg:w-[40%]">
            <CheckoutSummary
              items={items}
              onCheckout={handleCheckout}
              contactIsEditing={contactIsEditing}
            />
          </div>
        </div>
      </div>

      {showPayment && <PaymentMethodDialog createOrder={createPendingOrder} onClose={() => setShowPayment(false)} />}
    </div>
  );
}
