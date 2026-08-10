"use client";
import React, { useState } from "react";
import type { CartItem } from "@/lib/shop/cart";

const MAX_VISIBLE = 3;

export default function CheckoutOrderList({ items }: { items: CartItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const list = items || [];
  const showItems = expanded ? list : list.slice(0, MAX_VISIBLE);
  const hiddenCount = list.length - MAX_VISIBLE;

  return (
    <div className="w-full">
      <div className="flex flex-col w-full px-4 bg-[#FCF9F6] text-[#3D2419] font-bold text-base border-[3px] border-[#3D2419] shadow-[4px_4px_0px_0px_#3D2419]">
        {showItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 border-b-2 border-dashed border-[#3D2419] py-4 last:border-b-0">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-[#FFF0B8] text-sm sm:h-20 sm:w-20">
                {item.main_img ? (
                  <img src={`http://localhost:3001${item.main_img}`} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <span>商品照片</span>
                )}
              </div>
              <div className="min-w-0">
                <span className="block line-clamp-2 text-base font-bold leading-snug sm:text-xl">{item.name}</span>
                <span className="mt-1 block text-sm text-[#3D2419]/65">數量 × {item.qty}</span>
              </div>
            </div>
            <span className="shrink-0 text-base text-[#8C5230] sm:text-xl">${(item.price * item.qty).toLocaleString()}</span>
          </div>
        ))}
        {hiddenCount > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mb-4 mt-3 flex w-full items-center justify-center gap-2 border-[3px] border-[#3D2419] bg-[#FFD3B6] py-3 text-sm font-bold text-[#3D2419] shadow-[3px_3px_0px_0px_#3D2419] transition-all hover:bg-[#ffbe94] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
          >
            <span>{expanded ? "收合" : `還有 ${hiddenCount} 筆商品`}</span>
            <svg
              className={`w-4 h-4 fill-[#3D2419] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              viewBox="0 0 24 24"
            >
              <path d="M24 6h-24l12 12z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
