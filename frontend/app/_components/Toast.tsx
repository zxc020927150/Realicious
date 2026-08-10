"use client";

import styles from "./Toast.module.css";

export default function Toast({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`${styles.toastDrop} fixed inset-x-0 top-14 z-[80] mx-auto flex w-fit max-w-[calc(100vw-2rem)] items-center gap-2 border-[3px] border-black bg-[#FFD45C] px-4 py-2.5 text-center text-[13px] font-black whitespace-normal shadow-[0_4px_0_#000] sm:whitespace-nowrap`}
    >
      <span aria-hidden="true">✓</span>
      <span>{message}</span>
    </div>
  );
}
