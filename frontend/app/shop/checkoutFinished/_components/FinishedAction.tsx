import React from "react";
import Link from "next/link";

export default function FinishedAction() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-8">
      <Link
        href="/user/account/tickets"
        className="flex flex-col items-center justify-center min-h-28 px-4 py-5 bg-[#BB0015] text-white font-bold border-[3px] border-[#3D2419] shadow-[4px_4px_0px_0px_#3D2419] hover:bg-[#8E0010] hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#3D2419] transition-all"
      >
        <span className="text-xl font-black">查看我的票券</span>
        <span className="mt-1 text-xs text-white/75">前往票券中心兌換</span>
      </Link>

      <Link
        href="/shop"
        className="flex flex-col items-center justify-center min-h-28 px-4 py-5 bg-[#FFD45C] text-[#1A1721] font-bold border-[3px] border-[#3D2419] shadow-[4px_4px_0px_0px_#3D2419] hover:bg-[#FFE37A] hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#3D2419] transition-all"
      >
        <span className="text-xl font-black">繼續逛商城</span>
        <span className="mt-1 text-xs text-[#1A1721]/65">發掘下一張美味餐券</span>
      </Link>

      <Link
        href="/user/account/orders"
        className="flex flex-col items-center justify-center min-h-28 px-4 py-5 bg-[#1A1721] text-white font-bold border-[3px] border-[#3D2419] shadow-[4px_4px_0px_0px_#3D2419] hover:bg-[#302A3B] hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#3D2419] transition-all"
      >
        <span className="text-xl font-black">訂單紀錄</span>
        <span className="mt-1 text-xs text-white/65">查看付款與訂單資訊</span>
      </Link>
    </div>
  );
}
