"use client";
import React, { useEffect, useState, useMemo } from "react";
import { ClipboardList } from "lucide-react";
import Container from "../../_components/container";
import Left from "../_components/left";
import OrderItem from "@/app/shop/orders/_components/OrderItem";
import { getOrders, type Order } from "@/lib/shop/orders";
import { useUser } from "@/app/context/user";
import PageHeader from "@/app/_components/PageHeader";
import AccountEmptyState from "@/app/shop/_components/AccountEmptyState";
import "@/app/shop/shop-theme.css";

const FILTERS = [
  { key: "all", label: "全部訂單" },
  { key: "1", label: "待付款" },
  { key: "2", label: "付款完成" },
] as const;

export default function AccountOrders() {
  const { user } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    if (!user?.id) return;
    getOrders(Number(user.id)).then((res) => {
      if (res.success) setOrders(res.data);
    });
  }, [user?.id]);

  const filteredOrders = useMemo(() => {
    if (activeFilter === "all") return orders;
    return orders.filter((o) => String(o.status) === activeFilter);
  }, [orders, activeFilter]);

  return (
    <Container className="shop-theme min-h-[calc(100dvh-5rem)] flex-col items-stretch overflow-visible bg-white md:flex-row md:overflow-hidden">
      <Left />
      <div className="no-scrollbar w-full min-w-0 px-4 pb-28 pt-4 md:h-[720px] md:flex-1 md:overflow-y-auto md:pb-4">
        <PageHeader icon={<ClipboardList className="h-5 w-5" />} title="訂單紀錄" />

        {/* 篩選標籤 */}
        <div className="mb-6 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-3">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`min-w-0 px-2 py-2 text-xs font-bold border-[3px] border-[#3D2419] shadow-[3px_3px_0px_0px_#3D2419] cursor-pointer transition-all sm:px-5 sm:text-sm ${
                activeFilter === f.key
                  ? "bg-[#89502E] text-white"
                  : "bg-[#FCF9F6] text-[#3D2419] hover:bg-[#FBDF58]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 訂單列表 */}
        {filteredOrders.length === 0 ? (
          <AccountEmptyState
            icon={<ClipboardList className="size-6" />}
            title={orders.length === 0 ? "尚未建立任何訂單" : "此分類目前沒有訂單"}
            description={
              orders.length === 0
                ? "完成商城結帳後，付款狀態與訂單明細會顯示在這裡。"
                : "可以切換上方的訂單分類，查看其他付款狀態。"
            }
            actionHref={orders.length === 0 ? "/shop" : undefined}
            actionLabel={orders.length === 0 ? "前往商城選購" : undefined}
          />
        ) : (
          filteredOrders.map((order) => (
            <OrderItem key={order.id} order={order} />
          ))
        )}
      </div>
    </Container>
  );
}
