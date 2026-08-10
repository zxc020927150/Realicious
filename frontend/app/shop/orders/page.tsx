"use client";
import React, { useEffect, useState, useMemo } from "react";
import { ClipboardList } from "lucide-react";
import OrderItem from "./_components/OrderItem";
import { getOrders, type Order } from "@/lib/shop/orders";
import { useUser } from "@/app/context/user";
import PageHeader from "@/app/_components/PageHeader";

const FILTERS = [
  { key: "all", label: "全部訂單" },
  { key: "1", label: "待付款" },
  { key: "2", label: "付款完成" },
] as const;

export default function OrderPage() {
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
    <div className="relative min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <PageHeader icon={<ClipboardList className="h-5 w-5" />} title="我的訂單" />

        {/* 篩選標籤 */}
        <div className="flex flex-row gap-4 mb-6">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-6 py-2 font-bold text-base border-[3px] border-[#3D2419] shadow-[3px_3px_0px_0px_#3D2419] cursor-pointer transition-all ${
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
        <div className="w-full">
          {filteredOrders.length === 0 ? (
            <p className="text-center py-10 text-gray-500">尚無訂單</p>
          ) : (
            filteredOrders.map((order) => (
              <OrderItem key={order.id} order={order} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
