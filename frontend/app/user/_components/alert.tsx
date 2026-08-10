"use client";

import { ConfirmModal } from "@/app/_components/ConfirmModal";
import SiteModal, {
  SiteModalActions,
  SiteModalButton,
} from "@/app/_components/SiteModal";

// 定義彈窗支援的狀態型別
export type ModalType = "loading" | "success" | "error" | "confirm";

interface CustomModalProps {
  isOpen: boolean;
  type: ModalType;
  title: string;
  message?: string;
  onClose: () => void;      // 關閉、取消或失敗重試時的動作
  onConfirm?: () => void;    // 只有 confirm 狀態下，「確定」按鈕的動作
}

export default function CustomModal({
  isOpen,
  type,
  title,
  message,
  onClose,
  onConfirm,
}: CustomModalProps) {
  if (!isOpen) return null;

  if (type === "confirm") {
    return (
      <ConfirmModal
        title={title}
        message={message}
        onCancel={onClose}
        onConfirm={() => {
          if (onConfirm) onConfirm();
          onClose();
        }}
      />
    );
  }

  const isLoading = type === "loading";
  const isSuccess = type === "success";

  return (
    <SiteModal
      title={title}
      maxWidth="sm"
      onClose={isLoading ? () => {} : onClose}
    >
      <div
        className="flex items-start gap-3 border-y-2 border-black/10 py-4"
        aria-live={isLoading ? "polite" : undefined}
      >
        <div
          className={`grid size-11 shrink-0 place-items-center border-2 border-black ${
            isLoading
              ? "bg-[#FFD45C]"
              : isSuccess
                ? "bg-[#DDF3D8]"
                : "bg-[#F8D7DA]"
          }`}
          aria-hidden="true"
        >
          {isLoading ? (
            <span className="size-6 animate-spin rounded-full border-[3px] border-black border-t-transparent" />
          ) : isSuccess ? (
            <span className="text-2xl font-black leading-none">✓</span>
          ) : (
            <span className="text-2xl font-black leading-none">×</span>
          )}
        </div>
        <div className="min-w-0 pt-0.5">
          <p className="text-sm font-black text-black/65">
            {isLoading
              ? "系統正在處理，請稍候"
              : isSuccess
                ? "操作已順利完成"
                : "操作未完成"}
          </p>
          {message && (
            <p className="mt-1.5 whitespace-pre-line text-sm font-bold leading-6 text-black/55">
              {message}
            </p>
          )}
        </div>
      </div>

      {!isLoading && (
        <SiteModalActions>
          <SiteModalButton
            variant="primary"
            onClick={onClose}
            className="mt-5"
          >
            {isSuccess ? "知道了" : "確認"}
          </SiteModalButton>
        </SiteModalActions>
      )}
    </SiteModal>
  );
}
