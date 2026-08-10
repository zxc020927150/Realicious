"use client";
import React, { useSyncExternalStore } from "react";
import Breadcrumbs from "../_components/Breadcrumbs";
import OrderItem from "./_components/OrderItem";
import OrderSummary from "./_components/OrderSummary";
import EmptyCart from "./_components/EmptyCart";
import { clearCart, getCartItems, type CartItem } from "@/lib/shop/cart";
import { useConfirm } from "../_components/ConfirmModal";

const EMPTY: CartItem[] = [];
let cached = EMPTY;

function subscribe(cb: () => void) {
  window.addEventListener("cart-updated", cb);
  return () => window.removeEventListener("cart-updated", cb);
}

function getSnapshot() {
  const latest = getCartItems();
  if (latest.length === 0 && cached.length === 0) return cached;
  if (latest.length !== cached.length) { cached = latest; return cached; }
  for (let i = 0; i < latest.length; i++) {
    if (
      latest[i].id !== cached[i].id
      || latest[i].qty !== cached[i].qty
      || latest[i].stock_qty !== cached[i].stock_qty
      || latest[i].price !== cached[i].price
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

export default function CartPage() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [expanded, setExpanded] = React.useState(false);
  const [excludedIds, setExcludedIds] = React.useState<number[]>([]);
  const { confirmComponent, showConfirm } = useConfirm();

  const refresh = () => {}; // 自動同步，不需要手動更新
  const MAX_VISIBLE = 3;
  const showItems = expanded ? items : items.slice(0, MAX_VISIBLE);
  const hiddenCount = items.length - MAX_VISIBLE;
  const purchasableItems = items.filter((item) => item.stock_qty > 0 && item.qty <= item.stock_qty);
  const selectedItems = purchasableItems.filter((item) => !excludedIds.includes(item.id));
  const allSelected = purchasableItems.length > 0 && selectedItems.length === purchasableItems.length;

  const toggleItem = (productId: number) => {
    setExcludedIds((current) => current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId]);
  };

  const toggleAll = () => {
    setExcludedIds(allSelected ? purchasableItems.map((item) => item.id) : []);
  };

  return (
    <div className="relative min-h-screen scroll-smooth">
      {confirmComponent}
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 pt-4">
          <Breadcrumbs items={[
            { label: "首頁", href: "/" },
            { label: "商品列表", href: "/shop" },
            { label: "購物車" }
          ]} />
        </div>
        <div className="flex min-h-[calc(100vh-7rem)] flex-col gap-6 pb-16 md:pb-24 lg:flex-row lg:gap-8">
          <div className={items.length === 0 ? "w-full" : "w-full lg:w-[60%]"}>
            {items.length === 0 ? (
              <EmptyCart />
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <label className="flex cursor-pointer items-center gap-2 font-bold text-[#3D2419]">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="h-5 w-5 cursor-pointer accent-[#BB0015]"
                    />
                    全選（已選 {selectedItems.length}／{purchasableItems.length} 項）
                  </label>
                  <button
                    onClick={async () => {
                      const confirmed = await showConfirm("確定清空購物車嗎？");
                      if (confirmed) {
                        clearCart();
                        setExcludedIds([]);
                        refresh();
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-[#3D2419] font-bold text-sm
                              border-[3px] border-[#3D2419] shadow-[2px_2px_0px_0px_#3D2419]
                              hover:bg-red-50 active:translate-x-[1px] active:translate-y-[1px] transition-all duration-75 cursor-pointer"
                  >
                    <svg className="w-5 h-5 fill-[#3D2419]" viewBox="0 0 24 24">
                      <path d="M9 3h6v2H9V3zm-4 4h14v2H5V7zm2 4h10v10H7V11zm2 2v5h2v-5H9zm4 0v5h2v-5h-2z" />
                    </svg>
                    清空購物車
                  </button>
                </div>
                {showItems.map((item) => (
                  <OrderItem
                    key={item.id}
                    item={item}
                    checked={item.stock_qty > 0 && !excludedIds.includes(item.id)}
                    onCheckedChange={() => toggleItem(item.id)}
                    onUpdate={refresh}
                  />
                ))}
                {hiddenCount > 0 && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full mt-3 py-3 text-sm font-bold text-[#3D2419] bg-[#FFD3B6] border-[3px] border-[#3D2419] shadow-[3px_3px_0px_0px_#3D2419] hover:bg-[#ffbe94] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer flex items-center justify-center gap-2"
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
              </>
            )}
          </div>

          {items.length > 0 && (
            <div className="w-full self-start lg:sticky lg:top-[76px] lg:w-[40%]">
              <OrderSummary items={selectedItems} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
