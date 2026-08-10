"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import FinishedPhoto from "./_components/FinishedPhoto";
import FinishedOrderList from "./_components/FinishedOrderList";
import FinishedAction from "./_components/FinishedAction";
import { getLastOrder, type CartItem } from "@/lib/shop/cart";
import { completeCheckoutSession } from "@/lib/shop/checkout";
import { formatOrderNumber } from "@/lib/shop/order-number";

export default function CheckoutFinishedPage() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<CartItem[]>([]);
  const [orderId, setOrderId] = useState("");
  const [status, setStatus] = useState<"loading" | "success" | "fail">("loading");

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      const rtnCode = searchParams.get("RtnCode");
      const isCancelled = searchParams.get("cancel") === "1";
      const isSuccess = rtnCode === "1" || (searchParams.get("from") === "linepay" && !isCancelled);

      if (isSuccess) {
        const pendingId = localStorage.getItem("realicious-pending-order") || searchParams.get("orderId") || "";
        const completedItems = completeCheckoutSession();
        const cart = completedItems.length > 0 ? completedItems : getLastOrder();
        localStorage.removeItem("realicious-pending-order");

        if (pendingId && !sessionStorage.getItem("confirm-sent-" + pendingId)) {
          sessionStorage.setItem("confirm-sent-" + pendingId, "1");
          const token = Cookies.get("token");
          fetch(`http://localhost:3001/payment/confirm/${pendingId}`, {
            method: "PUT",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }).catch(() => {});
        }

        if (!cancelled) {
          setItems(cart);
          setOrderId(pendingId);
          setStatus("success");
        }
        return;
      }

      localStorage.removeItem("realicious-pending-order");
      if (!cancelled) setStatus("fail");
    });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  if (status === "loading") return null;

  if (status === "fail") {
    return (
      <div className="relative min-h-screen">
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="text-6xl mb-4">✕</div>
          <h2 className="text-3xl font-bold text-[#3D2419] mb-2">付款失敗</h2>
          <p className="text-gray-500 mb-6">交易未完成，購物車內容已保留</p>
          <Link href="/shop/checkout"
            className="px-6 py-3 bg-[#BB0015] text-white font-bold text-base border-[3px] border-[#3D2419] shadow-[3px_3px_0px_0px_rgba(61,36,25,0.4)] hover:bg-[#8E0010] transition-all"
          >
            返回結帳
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-16 md:pb-24">
      <div className="max-w-7xl mx-auto">
        <FinishedPhoto />
      </div>
      <div className="flex flex-col items-center justify-center text-center px-4 mb-8">
        <span className="inline-flex items-center bg-[#FFD45C] px-3 py-1.5 border-2 border-[#3D2419] shadow-[2px_2px_0px_0px_#3D2419] text-xs font-mono font-black tracking-[0.16em] text-[#1A1721]">
          ORDER COMPLETE
        </span>
        <h2 className="mt-5 text-4xl sm:text-5xl font-black tracking-wide text-[#1A1721]">
          付款成功！
        </h2>
        <p className="mt-3 text-base font-medium text-[#1A1721]/70">
          感謝您的購買，電子票券已發送至票券中心。
        </p>
        <div className="flex items-center gap-2 w-full max-w-md mt-6" aria-hidden>
          <span className="w-2.5 h-2.5 bg-[#BB0015] border border-[#1A1721]" />
          <span className="h-0.5 flex-1 bg-[#1A1721]" />
          <span className="w-2.5 h-2.5 bg-[#FFD45C] border border-[#1A1721]" />
          <span className="h-0.5 flex-1 bg-[#1A1721]" />
          <span className="w-2.5 h-2.5 bg-[#BB0015] border border-[#1A1721]" />
        </div>
      </div>
      <div className="flex flex-col items-center justify-center">
        <div className="w-[60%]">
          <FinishedOrderList items={items} orderId={formatOrderNumber(orderId)} />
        </div>
      </div>
      <div className="flex flex-col items-center justify-center">
        <div className="w-[70%]">
          <FinishedAction />
        </div>
      </div>
    </div>
  );
}
