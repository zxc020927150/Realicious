import React from "react";
import { useRouter } from "next/navigation";
import type { CartItem } from "@/lib/shop/cart";
import { useConfirm } from "../../_components/ConfirmModal";
import { useUser } from "@/app/context/user";
import { startCheckout } from "@/lib/shop/checkout";

export default function OrderSummary({ items }: { items: CartItem[] }) {
  const router = useRouter();
  const { user } = useUser();
  const { confirmComponent, showConfirm } = useConfirm();
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    const count = items.reduce((sum, item) => sum + item.qty, 0);
    const confirmed = await showConfirm(
      `確認結帳？\n\n共 ${count} 件商品\n總計 $${subtotal.toLocaleString()}\n\n確定前往結帳頁面？`,
    );
    if (!confirmed) return;

    startCheckout("cart", items);

    if (!user?.id) {
      const goToLogin = await showConfirm(
        "電子票券、訂單紀錄與待付款續付都會綁定會員帳號。\n\n請先登入會員後再結帳。",
        { confirmLabel: "前往登入" },
      );
      if (goToLogin) router.push("/user/login?next=/shop/checkout");
      return;
    }

    router.push("/shop/checkout");
  };

  return (
    <>
      {confirmComponent}
      <div
      className="flex flex-col w-full px-4 py-2.5
                  bg-[#FCF9F6] text-[#3D2419] font-bold text-base
                  border-[3px] border-[#3D2419]
                  shadow-[4px_4px_0px_0px_#3D2419]"
    >
      <div className="flex items-center justify-center mt-6">
        <h3 className="text-3xl">訂單摘要</h3>
      </div>
      <hr className="border-t-4 w-full mx-auto mt-5 border-gray-600" />
      <div className="flex flex-col gap-4 mt-6 w-full px-4 py-3">
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                <span className="min-w-0 line-clamp-2">
                  {item.name}
                  <span className="ml-1 whitespace-nowrap text-[#3D2419]/55">
                    ${item.price.toLocaleString()} × {item.qty}
                  </span>
                </span>
                <span className="shrink-0">${(item.price * item.qty).toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-[#3D2419]/35 bg-white px-3 py-4 text-center text-sm text-[#3D2419]/60">
            請先勾選本次要結帳的商品
          </div>
        )}
        <div className="flex justify-between border-t-2 border-[#3D2419]/20 pt-4">
          <span>商品小計</span>
          <span>${subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>營業稅 5%</span>
          <span>已內含</span>
        </div>
        <hr className="border-t-4 border-dashed border-gray-600 mt-6 mx-auto w-full" />
        <div className="flex justify-between mt-6">
          <h3 className="text-3xl">總計</h3>
          <h3 className="text-3xl">${subtotal.toLocaleString()}</h3>
        </div>
        <div
          onClick={handleCheckout}
          className={`flex items-center justify-center w-full px-4 py-2.5 mt-8
                     bg-[#89502E] text-[#FFFFFF] font-bold text-base
                     border-[3px] border-[#3D2419]
                     shadow-[4px_4px_0px_0px_#3D2419]
                     transition-all ${
                       items.length > 0
                         ? "cursor-pointer hover:bg-[#a06040] active:translate-x-[2px] active:translate-y-[2px]"
                         : "cursor-not-allowed opacity-45"
                     }`}
        >
          <span className="text-3xl">前往結帳</span>
        </div>
      </div>
    </div>
    </>
  );
}
