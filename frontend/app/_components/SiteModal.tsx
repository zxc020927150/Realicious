"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useId } from "react";

type SiteModalProps = {
  title: ReactNode;
  children: ReactNode;
  onClose: () => void;
  maxWidth?: "sm" | "md";
};

const MODAL_WIDTH = {
  sm: "max-w-[360px]",
  md: "max-w-md",
};

export default function SiteModal({
  title,
  children,
  onClose,
  maxWidth = "sm",
}: SiteModalProps) {
  const titleId = useId();

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className={`w-full ${MODAL_WIDTH[maxWidth]} border-[3px] border-black bg-[#FCF9F6] p-6 shadow-[0_4px_0_#000]`}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="mb-4 text-[16px] font-black">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

export function SiteModalActions({ children }: { children: ReactNode }) {
  return <div className="flex gap-2.5">{children}</div>;
}

type SiteModalButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function SiteModalButton({
  variant = "secondary",
  className = "",
  type = "button",
  ...props
}: SiteModalButtonProps) {
  const color =
    variant === "primary"
      ? "bg-[#BB0015] text-white hover:bg-[#8E0010]"
      : "bg-white text-black hover:bg-[#FCF9F6]";

  return (
    <button
      type={type}
      className={`btn-chunky flex-1 cursor-pointer border-[3px] border-black px-4 py-2.5 text-[14px] font-black shadow-[0_4px_0_#000] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFD45C] ${color} ${className}`}
      {...props}
    />
  );
}
