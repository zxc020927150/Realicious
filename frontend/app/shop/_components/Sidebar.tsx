import React, { useEffect, useState } from "react";

type SidebarFilterProps = {
  activeCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  onPriceChange: (min: number, max: number) => void;
  onFilterChange: (filters: Record<string, boolean>) => void;
};

export default function SidebarFilter({ activeCategoryId, onCategoryChange, onPriceChange, onFilterChange }: SidebarFilterProps) {
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [minPriceStr, setMinPriceStr] = useState("0");
  const [maxPriceStr, setMaxPriceStr] = useState("5000");
  const PRICE_MAX = 5000;
  const PRICE_STEP = 100;
  const [filters, setFilters] = useState<Record<string, boolean>>({
    onSale: false,
    inStock: false,
  });

  useEffect(() => {
    onFilterChange(filters);
  }, [filters]);

  const toggleFilter = (key: string) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const categories = [
    { id: "2", name: "電子票券", icon: <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 2a5 5 0 0 0-5 5v3H5v12h14V10h-2V7a5 5 0 0 0-5-5zm3 8H9V7a3 3 0 0 1 6 0v3zm-3 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" /></svg> },
    { id: "1", name: "電子雞服裝", icon: <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M2 4h20v16H2V4zm2 2v4a2 2 0 0 0 0 4v4h16v-4a2 2 0 0 0 0-4V6H4zm4 4h8v2H8v-2z" /></svg> },
    { id: "3", name: "虛擬頭像框", icon: <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 4a4 4 0 1 1-4 4 4 4 0 0 1 4-4zm0 12a8 8 0 0 1-6.66-3.57 7.93 7.93 0 0 1 13.32 0A8 8 0 0 1 12 18z" /></svg> },
  ];

  return (
    <div className="w-72 bg-[#FFF9E6] border-[3px] border-[#3D2419]  p-5 shadow-[4px_4px_0px_0px_#3D2419] font-bold text-[#3D2419] select-none">
      {/* 區塊一：商品分類 */}
      <div className="text-center text-xl tracking-wide mb-4">商品分類</div>
      <hr className="border-t-2 border-[#3D2419]/20 mb-5" />

      <div className="flex flex-col gap-3 mb-8">
        {/* 全部商品 */}
        <button
          onClick={() => onCategoryChange("")}
          className={`flex items-center gap-4 w-full px-4 py-3 text-lg border-[3px] transition-all duration-100 cursor-pointer ${
            activeCategoryId === ""
            ? "bg-[#FFD3B6] border-[#3D2419] shadow-[3px_3px_0px_0px_#3D2419]"
            : "bg-transparent border-transparent hover:bg-[#3D2419]/5"
          }`}
        >
          <span className={activeCategoryId === "" ? "text-[#3D2419]" : "text-[#3D2419]/80"}>
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M3 4h18v16H3V4zm2 2v12h14V6H5zm2 2h10v2H7V8zm0 4h10v2H7v-2z" />
            </svg>
          </span>
          <span className="tracking-wide">全部商品</span>
        </button>

        {categories.map((cat) => {
          return (
              <button
                  key={cat.name}
                  onClick={() => onCategoryChange(cat.id)}
                  className={`flex items-center gap-4 w-full px-4 py-3 text-lg border-[3px] transition-all duration-100 cursor-pointer
                    ${
                      activeCategoryId === cat.id
                    ? "bg-[#FFD3B6] border-[#3D2419] shadow-[3px_3px_0px_0px_#3D2419]"
                    : "bg-transparent border-transparent hover:bg-[#3D2419]/5"
                }`}
            >
              <span
                className={activeCategoryId === cat.id ? "text-[#3D2419]" : "text-[#3D2419]/80"}
              >
                {cat.icon}
              </span>
              <span className="tracking-wide">{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* 區塊二：價格範圍 */}
      <div className="text-center text-xl tracking-wide mb-4">價格範圍</div>
      <hr className="border-t-2 border-[#3D2419]/20 mb-5" />

      {/* 標籤：顯示當前選中的最低～最高 */}
      <div className="flex justify-between text-sm font-bold text-[#3D2419] mb-2 px-1">
        <span>${minPrice}</span>
        <span>${maxPrice}</span>
      </div>

      {/* 雙拉桿 slider */}
      <div className="relative h-6 mb-4 mx-1">
        {/* 軌道背景 */}
        <div className="absolute top-1/2 -translate-y-1/2 w-full h-2 bg-[#3D2419]/20" />

        {/* 選取範圍（兩拉桿之間） */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-2 bg-[#3D2419]"
          style={{
            left: `${(minPrice / PRICE_MAX) * 100}%`,
            width: `${((maxPrice - minPrice) / PRICE_MAX) * 100}%`,
          }}
        />

        {/* 最低拉桿 */}
        <input
          type="range"
          min={0}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={minPrice}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v <= maxPrice - PRICE_STEP) {
              setMinPrice(v);
              setMinPriceStr(String(v));
              onPriceChange(v, maxPrice);
            }
          }}
          className="absolute top-0 w-full h-full appearance-none bg-transparent pointer-events-none
                     [&::-webkit-slider-thumb]:pointer-events-auto
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-[#FF6B6B]
                     [&::-webkit-slider-thumb]:border-2
                     [&::-webkit-slider-thumb]:border-[#3D2419]
                     [&::-webkit-slider-thumb]:shadow-[1px_1px_0px_0px_#3D2419]
                     [&::-webkit-slider-thumb]:cursor-pointer"
        />

        {/* 最高拉桿 */}
        <input
          type="range"
          min={0}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={maxPrice}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v >= minPrice + PRICE_STEP) {
              setMaxPrice(v);
              setMaxPriceStr(String(v));
              onPriceChange(minPrice, v);
            }
          }}
          className="absolute top-0 w-full h-full appearance-none bg-transparent pointer-events-none
                     [&::-webkit-slider-thumb]:pointer-events-auto
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-[#FF6B6B]
                     [&::-webkit-slider-thumb]:border-2
                     [&::-webkit-slider-thumb]:border-[#3D2419]
                     [&::-webkit-slider-thumb]:shadow-[1px_1px_0px_0px_#3D2419]
                     [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>

      {/* 價格輸入框（手機友善） — 可自由輸入刪除，Enter / 離開時同步 */}
      <div className="flex items-center justify-between gap-3 mb-8">
        <input
          type="text"
          inputMode="numeric"
          placeholder="最低"
          value={minPriceStr}
          onChange={(e) => setMinPriceStr(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          onBlur={() => {
            const v = Number(minPriceStr);
            if (isNaN(v) || v < 0) { setMinPriceStr("0"); setMinPrice(0); onPriceChange(0, maxPrice); return }
            const clamped = Math.min(v, maxPrice - 100);
            setMinPriceStr(String(clamped));
            setMinPrice(clamped);
            onPriceChange(clamped, maxPrice);
          }}
          className="w-full h-10 text-center bg-white border-[3px] border-[#3D2419] focus:outline-none placeholder-[#3D2419]/40"
        />
        <span className="text-lg text-[#3D2419] font-bold">—</span>
        <input
          type="text"
          inputMode="numeric"
          placeholder="最高"
          value={maxPriceStr}
          onChange={(e) => setMaxPriceStr(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          onBlur={() => {
            const v = Number(maxPriceStr);
            if (isNaN(v) || v > 5000) { setMaxPriceStr("5000"); setMaxPrice(5000); onPriceChange(minPrice, 5000); return }
            const clamped = Math.max(v, minPrice + 100);
            setMaxPriceStr(String(clamped));
            setMaxPrice(clamped);
            onPriceChange(minPrice, clamped);
          }}
          className="w-full h-10 text-center bg-white border-[3px] border-[#3D2419] focus:outline-none placeholder-[#3D2419]/40"
        />
      </div>

      {/* 區塊三：條件篩選 (特價中、只顯示有貨、只顯示收藏) */}
      <div className="flex flex-col gap-4 pl-2">
        {/* 特價中 */}
        <label className="flex items-center gap-4 text-lg cursor-pointer group">
          <input
            type="checkbox"
            checked={filters.onSale}
            onChange={() => toggleFilter("onSale")}
            className="sr-only" // 隱藏原生網頁樣式
          />
          <div
            className={`w-6 h-6 border-[3px] border-[#3D2419] transition-all flex items-center justify-center shadow-[2px_2px_0px_0px_#3D2419]
            ${filters.onSale ? "bg-[#A8E6CF]" : "bg-white"}`}
          >
            {filters.onSale && (
              <div className="w-2 h-2 bg-[#3D2419]" />
            )}
          </div>
          <span className="group-hover:text-[#3D2419]/80">特價中</span>
        </label>

        {/* 只顯示有貨 */}
        <label className="flex items-center gap-4 text-lg cursor-pointer group">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={() => toggleFilter("inStock")}
            className="sr-only"
          />
          <div
            className={`w-6 h-6 border-[3px] border-[#3D2419] transition-all flex items-center justify-center shadow-[2px_2px_0px_0px_#3D2419]
            ${filters.inStock ? "bg-[#A8E6CF]" : "bg-white"}`}
          >
            {filters.inStock && (
              <div className="w-2 h-2 bg-[#3D2419]" />
            )}
          </div>
          <span className="group-hover:text-[#3D2419]/80">只顯示有貨</span>
        </label>
      </div>
    </div>
  );
}
