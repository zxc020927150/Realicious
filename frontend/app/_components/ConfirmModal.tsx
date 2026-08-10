"use client";

import { useCallback, useState } from "react";
import SiteModal, {
  SiteModalActions,
  SiteModalButton,
} from "@/app/_components/SiteModal";

export type ConfirmOptions = {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type ConfirmModalProps = ConfirmOptions & {
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  title = "請確認操作",
  message,
  onConfirm,
  onCancel,
  confirmLabel = "確定",
  cancelLabel = "取消",
}: ConfirmModalProps) {
  return (
    <SiteModal title={title} onClose={onCancel} maxWidth="md">
      {message && (
        <p className="mb-5 whitespace-pre-line text-[14px] font-bold leading-7 text-black/70 sm:text-base">
          {message}
        </p>
      )}
      <SiteModalActions>
        <SiteModalButton onClick={onCancel}>{cancelLabel}</SiteModalButton>
        <SiteModalButton variant="primary" onClick={onConfirm}>
          {confirmLabel}
        </SiteModalButton>
      </SiteModalActions>
    </SiteModal>
  );
}

export function useConfirm() {
  const [state, setState] = useState<
    (ConfirmOptions & {
      message: string;
      resolve: (value: boolean) => void;
    }) | null
  >(null);

  const showConfirm = useCallback(
    (message: string, options?: ConfirmOptions): Promise<boolean> =>
      new Promise((resolve) => {
        setState({ message, resolve, ...options });
      }),
    [],
  );

  const handleConfirm = useCallback(() => {
    state?.resolve(true);
    setState(null);
  }, [state]);

  const handleCancel = useCallback(() => {
    state?.resolve(false);
    setState(null);
  }, [state]);

  const confirmComponent = state ? (
    <ConfirmModal
      title={state.title}
      message={state.message}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
    />
  ) : null;

  return { confirmComponent, showConfirm };
}
