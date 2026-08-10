import React from "react";
import Link from "next/link";
import { ShoppingBasket } from "lucide-react";

export default function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center w-full py-20 px-4
                    bg-[#FCF9F6] text-[#3D2419] font-bold
                    border-[3px] border-[#3D2419]
                    shadow-[4px_4px_0px_0px_#3D2419]">
      <ShoppingBasket className="w-16 h-16 mb-4 text-[#3D2419]/40" />
      <p className="text-2xl mb-2">購物車裡沒有商品囉!</p>
      <p className="text-sm text-gray-500 mb-6">快去商城挑選喜歡的商品吧</p>
      <Link href="/shop"
        className="px-6 py-3 bg-[#3D2419] text-white text-base font-bold
                   shadow-[3px_3px_0px_0px_rgba(61,36,25,0.4)]
                   hover:bg-[#5a3a2a] active:translate-x-[1px] active:translate-y-[1px] transition-all"
      >
        前往商城
      </Link>
    </div>
  );
}
