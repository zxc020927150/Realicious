"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, CreditCard, FlaskConical, Smartphone } from "lucide-react";
import SiteModal, { SiteModalActions, SiteModalButton } from "@/app/_components/SiteModal";
import { paymentMethods, type PaymentMethod } from "@/lib/shop/payment";

type PaymentMethodDialogProps = {
  orderId?: number;
  createOrder?: () => Promise<number | null>;
  onClose: () => void;
};

export default function PaymentMethodDialog({ orderId, createOrder, onClose }: PaymentMethodDialogProps) {
  const router = useRouter();
  const [submittingMethod, setSubmittingMethod] = useState<PaymentMethod | null>(null);
  const [paymentError, setPaymentError] = useState("");
  const isSubmitting = submittingMethod !== null;

  // 從綠界按瀏覽器上一頁時，頁面可能由 bfcache 還原，
  // 需解除送出中的鎖定，讓使用者能關閉燈箱或重新選擇付款方式。
  useEffect(() => {
    const resetSubmitting = () => setSubmittingMethod(null);
    window.addEventListener("pageshow", resetSubmitting);
    return () => window.removeEventListener("pageshow", resetSubmitting);
  }, []);

  const handlePayment = async (methodId: PaymentMethod) => {
    if (isSubmitting) return;

    setPaymentError("");
    setSubmittingMethod(methodId);

    try {
      const targetOrderId = orderId ?? await createOrder?.();
      if (!targetOrderId) {
        setSubmittingMethod(null);
        return;
      }

      localStorage.setItem("realicious-pending-order", String(targetOrderId));
      await paymentMethods[methodId].checkout(targetOrderId);

      // 模擬付款不會離開目前頁面，需手動前往結果頁。
      if (methodId === "mock") {
        router.push(`/shop/checkoutFinished?RtnCode=1&orderId=${targetOrderId}`);
      }
    } catch (error) {
      localStorage.removeItem("realicious-pending-order");
      setPaymentError(
        error instanceof Error ? error.message : "付款導向失敗，請稍後再試",
      );
      setSubmittingMethod(null);
    }
  };

  if (paymentError) {
    const isStockError = paymentError.includes("庫存不足");

    return (
      <SiteModal
        title={isStockError ? "商品庫存不足" : "無法進行付款"}
        maxWidth="md"
        onClose={onClose}
      >
        <div className="flex items-start gap-3 border-y-2 border-black/10 py-4">
          <div
            className="grid size-11 shrink-0 place-items-center border-2 border-black bg-[#F8D7DA] text-2xl font-black leading-none"
            aria-hidden="true"
          >
            ×
          </div>
          <div className="min-w-0 pt-0.5">
            <p className="break-words text-sm font-black leading-6 text-[#BB0015]">
              {paymentError}
            </p>
            <p className="mt-2 text-xs font-bold leading-5 text-black/55 sm:text-sm">
              {isStockError
                ? "待付款訂單不會保留商品庫存，請返回商城確認目前可購買數量。"
                : "請稍後重新嘗試，或改用其他付款方式。"}
            </p>
          </div>
        </div>

        <SiteModalActions>
          <SiteModalButton
            variant="primary"
            onClick={onClose}
            className="mt-5"
          >
            {orderId ? "返回訂單紀錄" : "返回結帳頁"}
          </SiteModalButton>
        </SiteModalActions>
      </SiteModal>
    );
  }

  return (
    <SiteModal
      title="選擇支付方式"
      maxWidth="md"
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div className="mb-5 border-b-2 border-black/15 pb-4">
        <p className="text-sm font-bold text-black/60">請選擇這次結帳的付款方式</p>
        {orderId && <p className="mt-1 text-xs font-bold text-black/45">訂單 #{orderId}</p>}
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handlePayment("ecpay")}
          className="group flex w-full cursor-pointer items-center gap-3 border-[3px] border-black bg-white p-3 text-left shadow-[0_4px_0_#000] transition hover:-translate-y-0.5 hover:bg-[#FFD45C] hover:shadow-[0_6px_0_#000] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFD45C]/60 active:translate-y-1 active:shadow-none disabled:cursor-wait disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:bg-white disabled:hover:shadow-[0_4px_0_#000] sm:p-4"
          aria-label="使用綠界 ECPay 線上刷卡"
        >
          <span className="grid size-12 shrink-0 place-items-center border-2 border-black bg-[#E8F7EE] sm:size-14">
            <CreditCard aria-hidden="true" className="size-6 stroke-[2.5] sm:size-7" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-base font-black sm:text-lg">
                {submittingMethod === "ecpay" ? "正在前往綠界…" : "線上刷卡"}
              </span>
              <span className="border-2 border-black bg-white px-1.5 py-0.5 text-[10px] font-black text-[#008A4B] sm:text-xs">
                ECPay 綠界
              </span>
            </span>
            <span className="mt-1 block text-xs font-bold text-black/55 sm:text-sm">
              Visa／Mastercard／JCB
            </span>
          </span>
          <ChevronRight aria-hidden="true" className="size-5 shrink-0 stroke-[3] transition-transform group-hover:translate-x-0.5" />
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handlePayment("linepay")}
          className="group flex w-full cursor-pointer items-center gap-3 border-[3px] border-black bg-white p-3 text-left shadow-[0_4px_0_#000] transition hover:-translate-y-0.5 hover:bg-[#FFD45C] hover:shadow-[0_6px_0_#000] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFD45C]/60 active:translate-y-1 active:shadow-none disabled:cursor-wait disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:bg-white disabled:hover:shadow-[0_4px_0_#000] sm:p-4"
          aria-label="使用 LINE Pay 行動支付"
        >
          <span className="grid size-12 shrink-0 place-items-center border-2 border-black bg-[#DFF8E6] sm:size-14">
            <Smartphone aria-hidden="true" className="size-6 stroke-[2.5] sm:size-7" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-base font-black sm:text-lg">
                {submittingMethod === "linepay" ? "正在開啟 LINE Pay…" : "行動支付"}
              </span>
              <span className="border-2 border-black bg-[#06C755] px-1.5 py-0.5 text-[10px] font-black text-white sm:text-xs">
                LINE Pay
              </span>
            </span>
            <span className="mt-1 block text-xs font-bold text-black/55 sm:text-sm">
              使用 LINE Pay App 完成付款
            </span>
          </span>
          <ChevronRight aria-hidden="true" className="size-5 shrink-0 stroke-[3] transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className="my-5 flex items-center gap-3" aria-hidden="true">
        <span className="h-0.5 flex-1 bg-black/15" />
        <span className="text-[11px] font-black tracking-wider text-black/40">DEMO 測試工具</span>
        <span className="h-0.5 flex-1 bg-black/15" />
      </div>

      <button
        type="button"
        disabled={isSubmitting}
        onClick={() => handlePayment("mock")}
        className="flex w-full cursor-pointer items-center justify-center gap-2 border-2 border-dashed border-black/45 bg-black/5 px-3 py-2.5 text-xs font-black text-black/55 transition hover:border-black hover:bg-black/10 hover:text-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFD45C]/60 disabled:cursor-wait disabled:opacity-55 sm:text-sm"
      >
        <FlaskConical aria-hidden="true" className="size-4" />
        {submittingMethod === "mock" ? "正在建立測試付款…" : "模擬付款（略過第三方金流）"}
      </button>

      <SiteModalActions>
        <SiteModalButton
          disabled={isSubmitting}
          onClick={onClose}
          className="mt-5 disabled:cursor-not-allowed disabled:opacity-55"
        >
          取消
        </SiteModalButton>
      </SiteModalActions>
    </SiteModal>
  );
}
