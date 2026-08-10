import React from "react";

export default function ProductDescription({ description }: { description?: string }) {
  if (!description) return null;

  return (
    <div className="mt-12 max-w-7xl mx-auto p-8 bg-[#FCF9F6] border-[3px] border-[#3D2419] shadow-[4px_4px_0px_0px_#3D2419]">
      <h3 className="text-2xl font-black text-[#3D2419] text-center mb-8 tracking-wider">
        ✨ 商品詳細描述 ✨
      </h3>
      <div className="text-base text-[#3D2419]/80 leading-relaxed whitespace-pre-wrap text-center">
        {description}
      </div>
    </div>
  );
}
