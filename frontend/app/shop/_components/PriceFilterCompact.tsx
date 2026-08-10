"use client";
import React, { useState } from "react";

type Props = {
  minPrice: number;
  maxPrice: number;
  onPriceChange: (min: number, max: number) => void;
  filters: Record<string, boolean>;
  onFilterChange: (filters: Record<string, boolean>) => void;
};

const PRICE_MAX = 5000;
const PRICE_STEP = 100;

export default function PriceFilterCompact({ minPrice, maxPrice, onPriceChange, filters, onFilterChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 py-2 font-bold text-sm text-[#3D2419] bg-white border-[3px] border-[#3D2419] shadow-[2px_2px_0px_0px_#3D2419] hover:bg-gray-50 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer whitespace-nowrap"
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M3 4h18v2H3V4zm3 7h12v2H6v-2zm3 7h6v2H9v-2z"/></svg>
        篩選
        {open ? " ▴" : " ▾"}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-40 w-72 bg-[#FFF9E6] border-[3px] border-[#3D2419] p-5 shadow-[4px_4px_0px_0px_#3D2419] font-bold text-[#3D2419]">
          {/* 價格範圍 */}
          <div className="text-center text-sm tracking-wide mb-3">價格範圍</div>
          <div className="flex justify-between text-xs mb-2 px-1">
            <span>${minPrice}</span>
            <span>${maxPrice}</span>
          </div>
          <div className="relative h-6 mb-4 mx-1">
            <div className="absolute top-1/2 -translate-y-1/2 w-full h-2 bg-[#3D2419]/20" />
            <div className="absolute top-1/2 -translate-y-1/2 h-2 bg-[#3D2419]" style={{ left: `${(minPrice / PRICE_MAX) * 100}%`, width: `${((maxPrice - minPrice) / PRICE_MAX) * 100}%` }} />
            <input type="range" min={0} max={PRICE_MAX} step={PRICE_STEP} value={minPrice}
              onChange={(e) => { const v = Number(e.target.value); if (v <= maxPrice - PRICE_STEP) onPriceChange(v, maxPrice); }}
              className="absolute top-0 w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FF6B6B] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#3D2419] [&::-webkit-slider-thumb]:shadow-[1px_1px_0px_0px_#3D2419] [&::-webkit-slider-thumb]:cursor-pointer" />
            <input type="range" min={0} max={PRICE_MAX} step={PRICE_STEP} value={maxPrice}
              onChange={(e) => { const v = Number(e.target.value); if (v >= minPrice + PRICE_STEP) onPriceChange(minPrice, v); }}
              className="absolute top-0 w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FF6B6B] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#3D2419] [&::-webkit-slider-thumb]:shadow-[1px_1px_0px_0px_#3D2419] [&::-webkit-slider-thumb]:cursor-pointer" />
          </div>

          {/* 條件篩選 */}
          <div className="flex flex-col gap-3 pl-1">
            <label className="flex items-center gap-3 text-sm cursor-pointer group">
              <input type="checkbox" checked={filters.onSale}
                onChange={() => onFilterChange({ ...filters, onSale: !filters.onSale })} className="sr-only" />
              <div className={`w-5 h-5 border-[3px] border-[#3D2419] flex items-center justify-center shadow-[2px_2px_0px_0px_#3D2419] ${filters.onSale ? "bg-[#A8E6CF]" : "bg-white"}`}>
                {filters.onSale && <div className="w-1.5 h-1.5 bg-[#3D2419]" />}
              </div>
              <span>特價中</span>
            </label>
            <label className="flex items-center gap-3 text-sm cursor-pointer group">
              <input type="checkbox" checked={filters.inStock}
                onChange={() => onFilterChange({ ...filters, inStock: !filters.inStock })} className="sr-only" />
              <div className={`w-5 h-5 border-[3px] border-[#3D2419] flex items-center justify-center shadow-[2px_2px_0px_0px_#3D2419] ${filters.inStock ? "bg-[#A8E6CF]" : "bg-white"}`}>
                {filters.inStock && <div className="w-1.5 h-1.5 bg-[#3D2419]" />}
              </div>
              <span>只顯示有貨</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
