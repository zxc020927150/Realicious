"use client";

import { ConfirmModal } from "@/app/_components/ConfirmModal";

export default function ConfirmRemoveFavoriteDialog({
  productName,
  onCancel,
  onConfirm,
}: {
  productName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmModal
      title="移除收藏？"
      message={`確定要將「${productName}」從商品收藏移除嗎？`}
      cancelLabel="取消"
      confirmLabel="確認移除"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
