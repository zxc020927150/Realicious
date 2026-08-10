import React from "react";

export default function CheckoutPaymentMethod() {
  return (
    <div className="w-full">
      <div className="flex flex-col w-full px-4 py-3 bg-[#FCF9F6] text-[#3D2419] font-bold text-base border-[3px] border-[#3D2419] shadow-[4px_4px_0px_0px_#3D2419]">
        <h3 className="text-xl mb-3">支付方式</h3>
        <div className="flex flex-row items-center justify-around gap-4">
          <div className="flex-1">
            <button className="flex items-center justify-center gap-2 w-full py-4 bg-slate-200 text-slate-600 font-bold text-lg border-[3px] border-[#3D2419] shadow-[3px_3px_0px_0px_#3D2419] hover:bg-slate-300 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer">
              <svg className="w-6 h-6 shrink-0 fill-slate-600" viewBox="0 0 24 24">
                <path d="M2 5h20v14H2V5zm2 2v2h16V7H4zm0 4v6h16v-6H4zm2 2h4v2H6v-2z" />
              </svg>
              線上刷卡
            </button>
          </div>
          <div className="flex-1">
            <button className="flex items-center justify-center gap-2 w-full py-4 bg-slate-200 text-slate-600 font-bold text-lg border-[3px] border-[#3D2419] shadow-[3px_3px_0px_0px_#3D2419] hover:bg-slate-300 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer">
              <svg className="w-6 h-6 shrink-0 fill-slate-600" viewBox="0 0 24 24">
                <path d="M6 2h12v20H6V2zm2 2v14h8V4H8zm3 15h2v2h-2v-2z" />
              </svg>
              行動支付
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
