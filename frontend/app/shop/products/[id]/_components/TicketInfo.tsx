import React from "react";

export default function TicketInfo() {
  return (
    <section className="w-full bg-[#FCF9F6] border-[3px] border-[#3D2419] px-4 py-3 shadow-[3px_3px_0px_0px_#3D2419]">
      <h3 className="text-base font-black text-[#3D2419] mb-2">餐券資訊</h3>
      <ul className="space-y-1 text-sm font-medium text-[#3D2419]/80">
        <li>・本商品為單一兌換方案，價格已包含餐券內容。</li>
        <li>・付款完成後，電子票券將發送至我的票券。</li>
        <li>・實際兌換規範請參閱下方商品詳細描述。</li>
      </ul>
    </section>
  );
}
