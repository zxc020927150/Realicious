"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { Order, OrderItem as OrderDetailItem } from "@/lib/shop/orders";
import { getOrderDetail } from "@/lib/shop/orders";
import PaymentMethodDialog from "../../_components/PaymentMethodDialog";
import { formatOrderNumber } from "@/lib/shop/order-number";

export default function OrderItem({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [items, setItems] = useState<OrderDetailItem[]>([]);

  useEffect(() => {
    if (expanded && items.length === 0) {
      getOrderDetail(order.id).then((res) => {
        if (res.success) setItems(res.items);
      });
    }
  }, [expanded, order.id, items.length]);

  const date = new Date(order.created_at).toLocaleDateString("zh-TW");
  const orderNumber = formatOrderNumber(order.id);

  return (
    <div className="w-full mb-6">
      <div className="flex w-full select-none flex-col border-[3px] border-[#3D2419] bg-[#FCF9F6] p-3 text-base font-bold text-[#3D2419] shadow-[4px_4px_0px_0px_#3D2419] sm:p-5">
        <div className="flex w-full flex-col items-stretch gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex w-full shrink-0 flex-col items-start gap-1.5 text-left xl:w-48">
            <div className="text-sm font-black tracking-wide">
              訂單編號：<span className="text-[#8C5230]">{orderNumber}</span>
            </div>
            <div className="text-xs text-[#3D2419]/50 font-medium">{date}</div>
            <div className={`mt-2 flex max-w-full items-center justify-center border-[3px] border-[#3D2419] px-3 py-1 text-xs font-black shadow-[2px_2px_0px_0px_#3D2419] sm:text-sm ${
              order.status === 1 ? "bg-yellow-400 text-[#3D2419]" :
              order.status === 2 ? "bg-blue-400 text-white" :
              order.status === 3 ? "bg-[#466f44] text-white" :
              "bg-gray-300 text-gray-600"
            }`}>
              <span>{
                order.status === 1 ? "待付款" :
                order.status === 2 ? "付款完成・票券已發送" :
                order.status === 3 ? "交易完成" :
                "已取消"
              }</span>
            </div>
          </div>

          <div className="flex w-full min-w-0 flex-col items-stretch gap-4 text-left xl:flex-1 xl:flex-row xl:items-center xl:justify-end xl:gap-6 xl:pl-6 xl:text-right">
            <div className="flex min-w-0 flex-col items-start xl:items-end">
              <div className="text-lg font-black text-[#8C5230]">
                總計金額：${Number(order.total_price).toLocaleString()}
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center gap-3 xl:w-auto xl:flex-nowrap">
              {order.status === 1 && (
                <button
                  type="button"
                  onClick={() => setShowPayment(true)}
                  className="flex min-w-32 flex-1 justify-center border-[3px] border-[#3D2419] bg-[#FBDF58] px-4 py-2.5 text-sm font-black shadow-[3px_3px_0px_0px_#3D2419] hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#f5cc22] hover:shadow-[2px_2px_0px_0px_#3D2419] cursor-pointer xl:flex-none"
                >
                  繼續付款
                </button>
              )}
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex min-w-32 flex-1 items-center justify-center gap-2 border-[3px] border-[#3D2419] bg-white px-4 py-2.5 text-sm font-black shadow-[3px_3px_0px_0px_#3D2419] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#3D2419] cursor-pointer xl:flex-none"
              >
                <span>{expanded ? "收合" : "檢視明細"}</span>
                <span className={`text-xs transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>▼</span>
              </button>
            </div>
          </div>
        </div>

        {expanded && (
          <div className="mt-5 pt-5 border-t-4 border-dashed border-[#3D2419]/20 flex flex-col gap-3">
            <div className="text-xs text-[#3D2419]/60 text-left tracking-wider mb-1">
              訂單明細 / ITEM DETAILS
            </div>
            {items.map((item) => {
              const canOpenProduct = Boolean(item.product_id && item.is_active);
              return (
              <div key={item.id} className="flex flex-col items-start gap-2 bg-white border-[2px] border-[#3D2419] px-3 py-3 shadow-[2px_2px_0px_0px_#3D2419] lg:flex-row lg:items-center lg:justify-between lg:px-4">
                <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                  {canOpenProduct ? (
                    <Link
                      href={`/shop/products/${item.product_id}`}
                      className="break-words text-base text-[#3D2419] underline-offset-4 hover:text-[#BB0015] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BB0015]"
                    >
                      {item.product_name}
                    </Link>
                  ) : (
                    <>
                      <span className="text-base text-[#3D2419]/60">{item.product_name || "商品資料已移除"}</span>
                      <span className="shrink-0 border-2 border-[#3D2419]/40 bg-gray-100 px-2 py-0.5 text-xs text-[#3D2419]/60">
                        商品已下架
                      </span>
                    </>
                  )}
                </div>
                <div className="whitespace-nowrap text-sm text-[#3D2419]/80 sm:text-base">
                  數量: <span className="font-black text-[#3D2419]">x{item.quantity}</span> │ <span className="text-[#8C5230] font-black">${item.unit_price}</span>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
      {showPayment && <PaymentMethodDialog orderId={order.id} onClose={() => setShowPayment(false)} />}
    </div>
  );
}
