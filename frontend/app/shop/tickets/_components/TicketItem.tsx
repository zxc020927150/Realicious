"use client";
import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  isTicketExpired,
  isTicketUsable,
  type Ticket,
} from "@/lib/shop/tickets";
import { formatOrderNumber } from "@/lib/shop/order-number";

const TYPE_LABEL: Record<string, string> = {
  product: "商品兌換",
  discount: "折扣",
  cash: "現金折價",
};

const API_BASE = "http://localhost:3001";
const FALLBACK_IMAGE = `${API_BASE}/images/optimized/吃到飽.webp`;

function getImageUrl(imagePath: string) {
  return imagePath.startsWith("http") ? imagePath : `${API_BASE}${imagePath}`;
}

export default function TicketItem({ ticket, onRefresh }: { ticket: Ticket; onRefresh?: () => void }) {
  const [showQR, setShowQR] = useState(false);
  const [acting, setActing] = useState(false);
  const [now] = useState(() => Date.now());
  const date = new Date(ticket.created_at).toLocaleDateString("zh-TW");
  const expiresAt = ticket.expires_at
    ? new Date(ticket.expires_at).toLocaleDateString("zh-TW")
    : null;
  const isExpired = isTicketExpired(ticket, now);
  const isUsable = isTicketUsable(ticket, now);

  const demoAction = async (action: "redeem" | "expire") => {
    if (!ticket.redeem_code || acting || !isUsable) return;
    setActing(true);
    const response = await fetch(`${API_BASE}/tickets/${action}/${ticket.redeem_code}`, { method: "PUT" });
    const result = await response.json();
    setActing(false);
    if (!response.ok || !result.success) return;
    setShowQR(false);
    onRefresh?.();
  };

  return (
    <>
      <div className="w-full mb-6">
        <div className="flex w-full select-none flex-col border-[3px] border-[#3D2419] bg-[#FCF9F6] p-3 text-base font-bold text-[#3D2419] shadow-[4px_4px_0px_0px_#3D2419] sm:p-5">
          <div className="flex w-full flex-col items-stretch gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex w-full shrink-0 flex-col items-start gap-1.5 text-left xl:w-56">
              <div className="flex min-w-0 items-center gap-2">
                <img
                  src={ticket.product_img ? getImageUrl(ticket.product_img) : FALLBACK_IMAGE}
                  alt={ticket.product_name || ticket.name}
                  className="w-10 h-10 object-cover border-2 border-[#3D2419]"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
                <div className="min-w-0">
                  <div className="whitespace-nowrap text-sm font-black">
                    {ticket.order_id ? (
                      <>
                        訂單編號：<span className="text-[#8C5230]">{formatOrderNumber(ticket.order_id)}</span>
                      </>
                    ) : (
                      <>
                        發放方式：<span className="text-[#8C5230]">活動贈送</span>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-[#3D2419]/50 font-medium">取得日期：{date}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                <span className="inline-flex items-center bg-[#3D2419]/10 px-2.5 py-0.5 text-xs font-semibold text-[#3D2419]">
                  {TYPE_LABEL[ticket.type] || ticket.type}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold ${
                  isExpired ? "bg-red-100 text-red-700" :
                  ticket.status === 1 ? "bg-green-100 text-green-800" :
                  ticket.status === 2 ? "bg-gray-100 text-gray-600" :
                  "bg-red-100 text-red-700"
                }`}>
                  {isExpired ? "已過期" :
                   ticket.status === 1 ? "未使用" :
                   ticket.status === 2 ? "已使用" :
                   "已過期"}
                </span>
              </div>
            </div>

            <div className="flex w-full min-w-0 flex-col items-stretch gap-4 text-left xl:flex-1 xl:flex-row xl:items-center xl:justify-end xl:gap-6 xl:pl-6 xl:text-right">
              <div className="flex min-w-0 flex-col items-start xl:items-end">
                <h4 className="break-words text-lg font-black text-[#3D2419]">
                  {ticket.product_name || ticket.name}
                </h4>
                {ticket.product_price && (
                  <div className="text-base text-[#8C5230]">
                    原價 ${ticket.product_price.toLocaleString()}
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowQR(true)}
                disabled={!isUsable}
                className={`flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-black transition-all xl:w-auto ${
                  isUsable
                    ? "bg-[#FFD45C] border-[3px] border-[#3D2419] shadow-[3px_3px_0px_0px_#3D2419] hover:bg-[#FFE37A] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#3D2419] cursor-pointer text-[#3D2419]"
                    : "bg-gray-200 border-[3px] border-gray-400 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isUsable ? "出示核銷碼" : isExpired ? "票券已過期" : "票券已使用"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code 燈箱 */}
      {showQR && ticket.redeem_code && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4" onClick={() => setShowQR(false)}>
          <div className="max-h-[calc(100dvh-1rem)] w-full max-w-sm overflow-y-auto border-[3px] border-[#3D2419] bg-white px-4 py-4 shadow-[6px_6px_0px_0px_#3D2419] sm:max-h-[calc(100dvh-2rem)] sm:px-8 sm:py-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-[#3D2419] text-center mb-2">
              {ticket.product_name || ticket.name}
            </h3>
            <p className="text-xs text-gray-500 text-center mb-4">
              {TYPE_LABEL[ticket.type]} · {ticket.order_id ? formatOrderNumber(ticket.order_id) : "活動贈送"}
            </p>
            <div className="flex justify-center mb-4">
              <div className="border-[3px] border-[#3D2419] p-2 sm:p-3">
                <QRCodeSVG value={ticket.redeem_code} size={200} className="h-40 w-40 sm:h-[200px] sm:w-[200px]" />
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center break-all mb-3 select-all">
              {ticket.redeem_code}
            </p>
            <p className="text-xs text-gray-500 text-center">
              請出示此 QR Code 給店家掃碼核銷
            </p>
            {expiresAt && (
              <p className={`mt-1 text-center text-xs ${isExpired ? "text-red-500" : "text-gray-500"}`}>
                優惠兌換期限：{expiresAt}
              </p>
            )}
            {isExpired && (
              <p className="mt-1 text-center text-xs leading-relaxed text-red-500">
                已超過優惠兌換期限，請洽門市依現場規則補差額使用。
              </p>
            )}

            {/* Demo 按鈕群 */}
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t-2 border-dashed border-gray-300">
              <p className="text-xs text-gray-400 text-center">— Demo 功能 —</p>
              <div className="flex gap-2">
                <button
                  onClick={() => demoAction("redeem")}
                  disabled={acting}
                  className="flex-1 py-2 text-xs font-bold text-white bg-blue-500 border-2 border-blue-700 shadow-[2px_2px_0px_0px_#1e40af] hover:bg-blue-600 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer disabled:opacity-50"
                >
                  模擬核銷
                </button>
                <button
                  onClick={() => demoAction("expire")}
                  disabled={acting}
                  className="flex-1 py-2 text-xs font-bold text-white bg-red-400 border-2 border-red-600 shadow-[2px_2px_0px_0px_#dc2626] hover:bg-red-500 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer disabled:opacity-50"
                >
                  模擬逾期
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowQR(false)}
              className="w-full mt-4 py-2.5 font-bold text-sm text-[#3D2419] bg-white border-[3px] border-[#3D2419] shadow-[2px_2px_0px_0px_#3D2419] hover:bg-gray-100 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </>
  );
}
