import React from "react";
import type { CartItem } from "@/lib/shop/cart";

export default function FinishedOrderList({ items, orderId }: { items: CartItem[]; orderId: string }) {
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div>
      <div className="flex flex-col w-full px-4 py-2.5 bg-[#FCF9F6] text-[#3D2419] font-bold text-base border-[3px] border-[#3D2419] shadow-[4px_4px_0px_0px_#3D2419]">
        <div className="flex flex-row justify-between">
          <span className="text-2xl">訂單明細</span>
          <span className="text-2xl">[{orderId}]</span>
        </div>
        <hr className="mt-3 border-b-2 border-gray-500" />
        <div className="flex flex-col mt-4">
          {items.map((item) => (
            <div key={item.id} className="flex flex-row justify-between mb-2">
              <span>{item.name} x{item.qty}</span>
              <span>${item.price * item.qty}</span>
            </div>
          ))}
        </div>
        <hr className="border-t-4 border-dashed border-gray-500 mt-2 mx-auto w-full" />
        <div className="flex flex-row items-center justify-between mt-4">
          <div className="flex flex-col text-2xl">
            <p>訂單總金額</p>
            <p>Total Loot</p>
          </div>
          <div>
            <span className="text-2xl">${total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
