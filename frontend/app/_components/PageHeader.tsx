import React from "react";

export default function PageHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-6 flex items-center">
      <div className="inline-flex items-center gap-3 border border-[#e2ded4] bg-[#f8f6f0] px-4 py-2.5 shadow-sm">
        <div className="flex w-4 h-4 sm:h-9 sm:w-9 items-center justify-center bg-[#e8ded2] text-[#4a3525]">
          {icon}
        </div>
        <h1 className="sm:text-xl font-bold tracking-wide text-stone-800">{title}</h1>
      </div>
    </div>
  );
}
