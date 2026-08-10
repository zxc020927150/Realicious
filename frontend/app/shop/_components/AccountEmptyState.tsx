import Link from "next/link";
import type { ReactNode } from "react";

type AccountEmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export default function AccountEmptyState({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
}: AccountEmptyStateProps) {
  return (
    <div className="flex min-h-[220px] w-full flex-col items-center justify-center border-[3px] border-[#3D2419] bg-[#FCF9F6] px-5 py-8 text-center shadow-[4px_4px_0px_0px_#3D2419] sm:min-h-[280px] sm:px-8 sm:py-10">
      <div className="grid size-12 place-items-center border-[3px] border-[#3D2419] bg-[#FFD45C] text-[#3D2419] shadow-[2px_2px_0px_0px_#3D2419] sm:size-14">
        {icon}
      </div>
      <h2 className="mt-5 break-keep text-lg font-black leading-7 text-[#3D2419] sm:text-xl">
        {title}
      </h2>
      <p className="mt-2 max-w-sm text-sm font-bold leading-6 text-[#3D2419]/60">
        {description}
      </p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-5 inline-flex min-h-11 items-center justify-center border-[3px] border-[#3D2419] bg-[#BB0015] px-5 py-2.5 text-sm font-black text-white shadow-[3px_3px_0px_0px_#3D2419] transition hover:bg-[#8E0010] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
