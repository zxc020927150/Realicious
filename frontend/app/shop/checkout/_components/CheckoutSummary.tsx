"use client";
import React, { useEffect, useState } from "react";
import type { CartItem } from "@/lib/shop/cart";
import TicketPolicyDialog from "./TicketPolicyDialog";

export default function CheckoutSummary({
  items,
  onCheckout,
  contactIsEditing = false,
}: {
  items: CartItem[];
  onCheckout: () => void;
  contactIsEditing?: boolean;
}) {
  const [agreed, setAgreed] = useState(false);
  const [hint, setHint] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const subtotal = (items || []).reduce((sum, item) => sum + item.price * item.qty, 0);
  const canCheckout = agreed && !contactIsEditing;

  useEffect(() => {
    if (hint) {
      const timer = setTimeout(() => setHint(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [hint]);

  const handleCheckout = () => {
    if (!agreed) { setHint(true); return; }
    onCheckout();
  };

  return (
    <div className="flex flex-col w-full px-4 py-2.5 bg-[#FCF9F6] text-[#3D2419] font-bold text-base border-[3px] border-[#3D2419] shadow-[4px_4px_0px_0px_#3D2419]">
      <div className="flex items-center justify-center mt-6">
        <h3 className="text-2xl sm:text-3xl">訂單最後確認</h3>
      </div>
      <hr className="border-t-4 w-full mx-auto mt-5 border-gray-600" />
      <div className="flex flex-col gap-4 mt-6 w-full px-4 py-3">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
              <span className="min-w-0 line-clamp-2">
                {item.name}
                <span className="ml-1 whitespace-nowrap text-[#3D2419]/55">
                  ${item.price.toLocaleString()} × {item.qty}
                </span>
              </span>
              <span className="shrink-0">${(item.price * item.qty).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between border-t-2 border-[#3D2419]/20 pt-4">
          <span>商品小計</span>
          <span>${subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>營業稅 5%</span>
          <span>已內含</span>
        </div>
        <hr className="border-t-4 border-dashed border-gray-600 mt-6 mx-auto w-full" />
        <div className="flex justify-between mt-6">
          <h3 className="text-xl sm:text-2xl">總計</h3>
          <h3 className="text-xl sm:text-2xl">${subtotal.toLocaleString()}</h3>
        </div>
        <div className={`mt-6 flex flex-wrap items-center gap-x-1.5 gap-y-2 select-none transition-all duration-200 ${hint ? "animate-pulse" : ""}`}>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => {
                setAgreed(event.target.checked);
                if (event.target.checked) setHint(false);
              }}
              className="sr-only"
            />
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center border-[3px] shadow-[1px_1px_0px_0px_#3D2419] transition-colors ${hint ? "border-red-500 bg-red-100" : agreed ? "border-[#3D2419] bg-[#A8E6CF]" : "border-[#3D2419] bg-white"}`}>
              {agreed && <span className="h-2 w-2 bg-[#3D2419]" />}
            </span>
            <span className={`text-sm leading-tight transition-colors ${hint ? "text-red-500" : "text-[#3D2419]/80"}`}>
              我已經閱讀並同意
            </span>
          </label>
          <button
            type="button"
            onClick={() => setShowPolicy(true)}
            className="cursor-pointer text-left text-sm font-black leading-tight text-[#BB0015] underline decoration-2 underline-offset-4 hover:text-[#8E0010]"
          >
            電子票券使用及退款規範
          </button>
        </div>
        <div
          onClick={handleCheckout}
          className={`flex items-center justify-center w-full px-4 py-2.5 mt-8 bg-[#89502E] text-[#FFFFFF] font-bold text-base border-[3px] border-[#3D2419] shadow-[4px_4px_0px_0px_#3D2419] transition-all ${canCheckout ? "cursor-pointer hover:bg-[#a06040] active:translate-x-[2px] active:translate-y-[2px]" : "opacity-50 cursor-not-allowed"}`}
        >
          <span className="text-2xl sm:text-3xl">確認結帳</span>
        </div>
        <div className={`flex justify-center text-center transition-opacity ${canCheckout ? "opacity-100" : "opacity-50"}`}>
          <span>{contactIsEditing ? "*請先完成聯絡資訊修改" : "*點擊後將開始進行支付"}</span>
        </div>
      </div>
      {showPolicy && (
        <TicketPolicyDialog
          onClose={() => setShowPolicy(false)}
          onAgree={() => {
            setAgreed(true);
            setHint(false);
            setShowPolicy(false);
          }}
        />
      )}
    </div>
  );
}
