"use client";

type TicketPolicyDialogProps = {
  onClose: () => void;
  onAgree: () => void;
};

const POLICY_ITEMS = [
  "付款成功後，電子票券將發送至會員票券中心，請登入原購買帳號查看。",
  "每張票券皆有專屬兌換碼，僅限核銷一次；使用後即無法再次出示或轉回未使用狀態。",
  "優惠兌換期限以票券頁標示日期為準，本 Demo 票券的展示期限為付款後 180 天。",
  "核銷時請出示票券中心內的 QR Code，截圖、轉傳或外洩兌換碼所產生的風險由持有人自行承擔。",
  "未使用票券如需取消或退款，將依實際合作商家、付款方式及退款規則辦理。",
  "超過優惠兌換期限的票券，請洽合作商家確認是否可補差額使用或採取其他處理方式。",
];

export default function TicketPolicyDialog({
  onClose,
  onAgree,
}: TicketPolicyDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-policy-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col border-[3px] border-[#1A1721] bg-[#FCF9F6] shadow-[8px_8px_0px_0px_#FFD45C]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b-[3px] border-[#1A1721] bg-[#1A1721] px-5 py-4 text-white">
          <div>
            <p className="mb-1 text-xs font-bold tracking-[0.18em] text-[#FFD45C]">
              E-VOUCHER POLICY
            </p>
            <h2 id="ticket-policy-title" className="text-xl font-black sm:text-2xl">
              電子票券使用及退款規範
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉電子票券規範"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center border-2 border-white bg-[#BB0015] text-xl font-black text-white hover:bg-[#8E0010]"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-7">
          <ol className="space-y-3">
            {POLICY_ITEMS.map((item, index) => (
              <li
                key={item}
                className="flex items-start gap-3 border-2 border-[#3D2419]/20 bg-white px-3 py-3 text-sm font-medium leading-6 text-[#3D2419]"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-[#FFD45C] font-black text-[#1A1721]">
                  {index + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>

          <p className="mt-4 border-l-4 border-[#BB0015] bg-red-50 px-3 py-2 text-xs font-medium leading-5 text-[#3D2419]/70">
            此內容為專案 Demo 展示規範；正式上線前，仍需依合作商家政策、實際付款方式及相關法規確認正式條款。
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t-[3px] border-[#1A1721] bg-[#FFF0B8] px-5 py-4 sm:flex sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer border-[3px] border-[#1A1721] bg-white px-5 py-2.5 font-black text-[#1A1721] shadow-[3px_3px_0px_0px_#1A1721] hover:bg-[#FCF9F6] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            返回
          </button>
          <button
            type="button"
            onClick={onAgree}
            className="cursor-pointer border-[3px] border-[#1A1721] bg-[#BB0015] px-5 py-2.5 font-black text-white shadow-[3px_3px_0px_0px_#1A1721] hover:bg-[#8E0010] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            同意規範
          </button>
        </div>
      </div>
    </div>
  );
}
