import React, { useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/shop/product";
import { addToCart } from "@/lib/shop/cart";
import { addFavorite, removeFavorite } from "@/lib/shop/favorites";
import { useUser } from "@/app/context/user";
import { useToast } from "./Toast";

const API_BASE = "http://localhost:3001";
const FALLBACK_IMAGE = `${API_BASE}/images/optimized/吃到飽.webp`;

export default function ProductCard({
  product,
  favoritedProductIds = [],
  onFavoriteChange,
}: {
  product: Product;
  favoritedProductIds?: number[];
  onFavoriteChange: (productId: number, isFavorited: boolean) => void;
}) {
  const { user } = useUser();
  const [showCart, setShowCart] = useState(false);
  const { showToast } = useToast();
  const favorited = favoritedProductIds.includes(product.id);
  const soldOut = product.stock_qty <= 0;

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id) {
      showToast("請先登入會員後再收藏商品");
      return;
    }
    const userId = Number(user.id);
    try {
      if (favorited) {
        const result = await removeFavorite(userId, product.id);
        if (result.success) {
          onFavoriteChange(product.id, false);
          showToast("已從商品收藏移除");
        } else {
          showToast(result.message || "取消收藏失敗，請稍後再試");
        }
      } else {
        const result = await addFavorite(userId, product.id);
        if (result.success) {
          onFavoriteChange(product.id, true);
          showToast("已加入商品收藏");
        } else {
          showToast(result.message || "加入收藏失敗，請稍後再試");
        }
      }
    } catch {
      showToast("收藏操作失敗，請稍後再試");
    }
  };

  return (
    <>
    <div className="relative block w-full h-80 overflow-hidden border-[3px] border-[#3D2419] shadow-[4px_4px_0px_0px_#3D2419] group cursor-pointer"
      onMouseEnter={() => setShowCart(true)}
      onMouseLeave={() => setShowCart(false)}
    >
      {/* 點圖片跳轉詳細頁 */}
      <Link href={`/shop/products/${product.id}`} className="absolute inset-0 block cursor-pointer">
        <img
          src={product.main_img ? `${API_BASE}${product.main_img}` : FALLBACK_IMAGE}
          alt={product.name}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </Link>

      {soldOut && (
        <div className="absolute left-3 top-3 z-10 border-[3px] border-[#3D2419] bg-[#BB0015] px-3 py-1.5 text-sm font-black text-white shadow-[2px_2px_0px_0px_#3D2419]">
          暫時售完
        </div>
      )}

      {/* 飄浮字卡 */}
      <div className="flex flex-row items-center justify-center gap-3 absolute bottom-3 left-3 right-3 bg-white/85 border-[2px] border-[#3D2419] shadow-[2px_2px_0px_0px_#3D2419] p-3 text-left pointer-events-none">
        <p className="flex-1 min-w-0 text-[#3D2419] font-black text-base leading-snug line-clamp-2 tracking-wide">
          {product.name}
        </p>
        <p className="shrink-0 text-[#8C5230] font-black text-lg tracking-wider">
          ${product.price}
        </p>
      </div>

      {/* Hover 時出現的購物車 + 收藏按鈕 */}
      {showCart && (
        <div className="absolute bottom-20 left-3 right-3 flex items-center justify-between transition-opacity duration-200">
          <button
            type="button"
            disabled={soldOut}
            onClick={(e) => {
              e.stopPropagation();
              if (soldOut) return;
              const result = addToCart(product, 1);
              showToast(result.addedQty > 0
                ? `${product.name} 已加入購物車`
                : `已達可購買上限 ${result.stockLimit} 件`);
            }}
            className={`px-4 py-2 text-white font-bold text-sm border-2 border-white shadow-md transition-colors ${
              soldOut
                ? "cursor-not-allowed bg-gray-500"
                : "cursor-pointer bg-[#3D2419] hover:bg-[#5a3a2a]"
            }`}
          >
            {soldOut ? "已售完" : "加入購物車"}
          </button>
          <button
            onClick={toggleFavorite}
            className="w-10 h-10 flex items-center justify-center bg-white border-2 border-[#3D2419] shadow-md hover:bg-red-50 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5 transition-all" viewBox="0 0 24 24"
              fill={favorited ? "#ef4444" : "none"}
              stroke={favorited ? "#ef4444" : "#3D2419"}
              strokeWidth="2"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
        </div>
      )}
    </div>
    </>
  );
}
