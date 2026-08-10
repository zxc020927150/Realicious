import React from "react";
import Link from "next/link";
import QuantityPicker from "../../_components/QuantityPicker";
import { removeFromCart, updateQty, type CartItem } from "@/lib/shop/cart";
import { useConfirm } from "../../_components/ConfirmModal";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
const FALLBACK_IMAGE = "/images/optimized/food-placeholder.webp";

function getImageUrl(imagePath: string) {
  return imagePath.startsWith("http") ? imagePath : `${API_BASE}${imagePath}`;
}

type OrderItemProps = {
  item: CartItem;
  checked: boolean;
  onCheckedChange: () => void;
  onUpdate: () => void;
};

export default function OrderItem({
  item,
  checked,
  onCheckedChange,
  onUpdate,
}: OrderItemProps) {
  const { confirmComponent, showConfirm } = useConfirm();
  const soldOut = item.stock_qty <= 0;

  const handleRemove = async () => {
    const confirmed = await showConfirm(`確定移除 ${item.name} 嗎？`);
    if (confirmed) {
      removeFromCart(item.id);
      onUpdate();
    }
  };

  return (
    <div className="mb-3">
      {confirmComponent}
      <div
        className="flex flex-col sm:flex-row gap-4 w-full px-4 py-4
                  bg-[#FCF9F6] text-[#3D2419] font-bold text-base
                  border-[3px] border-[#3D2419]
                  shadow-[4px_4px_0px_0px_#3D2419]"
      >
        <label className={`flex shrink-0 items-center gap-2 font-bold ${soldOut ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
          <input
            type="checkbox"
            checked={checked}
            disabled={soldOut}
            onChange={onCheckedChange}
            aria-label={`選擇 ${item.name}`}
            className="h-5 w-5 cursor-pointer accent-[#BB0015] disabled:cursor-not-allowed"
          />
          <span className="sm:hidden">本次結帳</span>
        </label>
        <Link
          href={`/shop/products/${item.id}`}
          aria-label={`查看 ${item.name} 商品詳情`}
          className="shrink-0 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#BB0015]"
        >
          <div className="bg-[#FFF0B8] w-full h-48 sm:w-30 sm:h-30 flex items-center justify-center">
            <img
              src={item.main_img ? getImageUrl(item.main_img) : FALLBACK_IMAGE}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
          </div>
        </Link>
        <div className="flex flex-1 flex-col justify-between min-w-0 py-1">
          <Link
            href={`/shop/products/${item.id}`}
            className="w-fit text-lg leading-snug underline-offset-4 hover:text-[#BB0015] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BB0015]"
          >
            {item.name}
          </Link>
          <span className="mt-3 text-lg text-[#8C5230]">${item.price}</span>
          <span className={`mt-1 text-xs ${soldOut ? "text-[#BB0015]" : "text-[#3D2419]/55"}`}>
            {soldOut ? "目前已售完，無法結帳" : `庫存上限 ${item.stock_qty} 件`}
          </span>
        </div>

        <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-4 sm:gap-5 sm:ml-auto">
          <div>
            {soldOut ? (
              <span className="inline-flex border-2 border-[#BB0015] bg-red-50 px-3 py-2 text-sm text-[#BB0015]">
                已售完
              </span>
            ) : (
              <QuantityPicker
                value={item.qty}
                max={item.stock_qty}
                onChange={(qty) => { updateQty(item.id, qty); onUpdate(); }}
                onReachMin={handleRemove}
              />
            )}
          </div>
          <button
            onClick={handleRemove}
            className="flex items-center gap-1.5 px-2 py-1 text-sm text-[#BB0015] hover:bg-red-50 cursor-pointer active:translate-x-[1px] active:translate-y-[1px] transition-all duration-75"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M9 3h6v2H9V3zm-4 4h14v2H5V7zm2 4h10v10H7V11zm2 2v5h2v-5H9zm4 0v5h2v-5h-2z" />
            </svg>
            <span>移除</span>
          </button>
        </div>
      </div>
    </div>
  );
}
