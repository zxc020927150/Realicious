"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Ticket as TicketIcon } from "lucide-react";
import TicketItem from "./_components/TicketItem";
import {
  getTickets,
  isTicketExpired,
  isTicketUsable,
  type Ticket,
} from "@/lib/shop/tickets";
import { useUser } from "@/app/context/user";
import PageHeader from "@/app/_components/PageHeader";

const FILTERS = [
  { key: "all", label: "全部票券" },
  { key: "usable", label: "未使用" },
  { key: "expired", label: "已過期" },
  { key: "2", label: "已使用" },
] as const;

export default function TicketPage() {
  const { user } = useUser();
  const userId = user?.id;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [now, setNow] = useState(() => Date.now());

  const fetchTickets = useCallback(() => {
    if (!userId) return;
    getTickets(Number(userId)).then((res) => {
      if (res.success) {
        setTickets(res.data);
        setNow(Date.now());
      }
    });
  }, [userId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filteredTickets = useMemo(() => {
    if (activeFilter === "all") return tickets;
    if (activeFilter === "usable") return tickets.filter((ticket) => isTicketUsable(ticket, now));
    if (activeFilter === "expired") return tickets.filter((ticket) => isTicketExpired(ticket, now));
    return tickets.filter((t) => String(t.status) === activeFilter);
  }, [tickets, activeFilter, now]);

  return (
    <div className="relative min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <PageHeader icon={<TicketIcon className="h-5 w-5" />} title="我的票券" />

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

        {/* 票券列表 */}
        <div className="w-full">
          {filteredTickets.length === 0 ? (
            <p className="text-center py-10 text-gray-500">暫無票券</p>
          ) : (
            filteredTickets.map((ticket) => (
              <TicketItem key={ticket.id} ticket={ticket} onRefresh={fetchTickets} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
