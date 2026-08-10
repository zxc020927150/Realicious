import React, { useEffect, useState, useRef } from "react";

type CategoryFilterProps = {
  activeKeyword: string;
  minPrice: number;
  maxPrice: number;
  priceMax: number;
  onTagChange: (keyword: string) => void;
  onPriceChange: (min: number, max: number) => void;
  onReset: () => void;
};

export default function CategoryFilter({
  activeKeyword, minPrice, maxPrice, priceMax,
  onTagChange, onPriceChange, onReset,
}: CategoryFilterProps) {
  const clampedMax = Math.min(maxPrice, priceMax);
  const [slideMin, setSlideMin] = useState(Math.min(minPrice, priceMax));
  const [slideMax, setSlideMax] = useState(clampedMax);
  const [minStr, setMinStr] = useState(String(minPrice));
  const [maxStr, setMaxStr] = useState(String(maxPrice));
  const [isCustomPriceOpen, setIsCustomPriceOpen] = useState(false);
  const committing = useRef(false);
  const raf = useRef(0);

  const commitPrice = (min: number, max: number) => {
    committing.current = true;
    onPriceChange(min, max);
    setTimeout(() => { committing.current = false; }, 0);
  };

  const handleSlider = (type: "min" | "max", v: number) => {
    if (type === "min" && v > slideMax) return;
    if (type === "max" && v < slideMin) return;
    if (type === "min") {
      setSlideMin(v);
      setMinStr(String(v));
    } else {
      setSlideMax(v);
      setMaxStr(String(v));
    }
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      commitPrice(type === "min" ? v : slideMin, type === "max" ? v : slideMax);
    });
  };

  useEffect(() => {
    if (!committing.current) { setSlideMin(minPrice); setSlideMax(maxPrice); setMinStr(String(minPrice)); setMaxStr(String(maxPrice)); }
  }, [minPrice, maxPrice]);

  const applyInput = () => {
    const parsedMin = minStr.trim() === "" ? 0 : Number(minStr);
    const parsedMax = maxStr.trim() === "" ? priceMax : Number(maxStr);
    const min = Math.max(0, Math.min(priceMax, Number.isFinite(parsedMin) ? parsedMin : 0));
    const max = Math.max(0, Math.min(priceMax, Number.isFinite(parsedMax) ? parsedMax : priceMax));
    const clampedMin = Math.min(min, max);
    const clampedMax = Math.max(min, max);
    setMinStr(String(clampedMin));
    setMaxStr(String(clampedMax));
    setSlideMin(clampedMin);
    setSlideMax(clampedMax);
    commitPrice(clampedMin, clampedMax);
  };

  const handlePriceInput = (type: "min" | "max", value: string) => {
    const nextMinStr = type === "min" ? value : minStr;
    const nextMaxStr = type === "max" ? value : maxStr;
    if (type === "min") setMinStr(value);
    else setMaxStr(value);

    const parsedMin = nextMinStr.trim() === "" ? 0 : Number(nextMinStr);
    const parsedMax = nextMaxStr.trim() === "" ? priceMax : Number(nextMaxStr);
    const rawMin = Math.max(0, Math.min(priceMax, Number.isFinite(parsedMin) ? parsedMin : 0));
    const rawMax = Math.max(0, Math.min(priceMax, Number.isFinite(parsedMax) ? parsedMax : priceMax));
    const nextMin = Math.min(rawMin, rawMax);
    const nextMax = Math.max(rawMin, rawMax);

    setSlideMin(nextMin);
    setSlideMax(nextMax);
    commitPrice(nextMin, nextMax);
  };

  const tags = [
    { label: "鍋物", keyword: "hotpot" },
    { label: "炸雞／炸物", keyword: "fried" },
    { label: "漢堡", keyword: "burger" },
    { label: "比薩", keyword: "pizza" },
    { label: "鍋貼／水餃", keyword: "dumplings" },
    { label: "吃到飽", keyword: "buffet" },
  ];
  const pricePresets = [
    { label: "全部", min: 0, max: priceMax },
    { label: "$199以下", min: 0, max: 199 },
    { label: "$200–499", min: 200, max: 499 },
    { label: "$500–999", min: 500, max: 999 },
    { label: "$1,000以上", min: 1000, max: priceMax },
  ];

  return (
    <div className="flex w-full flex-col gap-4 border-[3px] border-[#3D2419] bg-white px-3 py-3 text-base font-bold text-[#3D2419] shadow-[4px_4px_0px_0px_#3D2419] sm:px-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-[#3D2419]/60">快速篩選</span>
          <button
            type="button"
            onClick={onReset}
            className="shrink-0 border-2 border-[#3D2419] bg-white px-3 py-1 text-xs text-[#3D2419] shadow-[2px_2px_0px_0px_#3D2419] transition-colors hover:bg-[#ffbe94] cursor-pointer"
          >
            全部商品
          </button>
        </div>

        {/* Demo 商品的快速導覽；未使用資料庫標籤。 */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {tags.map((tag) => (
            <button
              key={tag.label}
              type="button"
              className={`w-full border-[3px] border-[#3D2419] px-2 py-1.5 text-sm shadow-[2px_2px_0px_0px_#3D2419] transition-colors cursor-pointer ${
                activeKeyword === tag.keyword
                  ? "bg-[#3D2419] text-white"
                  : "bg-[#FFD3B6] text-[#3D2419] hover:bg-[#ffbe94]"
              }`}
              onClick={() => onTagChange(activeKeyword === tag.keyword ? "" : tag.keyword)}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t-2 border-dashed border-[#3D2419]/20 pt-3">
        {/* 價格快捷篩選 */}
        <span className="text-sm font-bold text-[#3D2419]/60">價格範圍</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap">
          {pricePresets.map((preset) => {
            const isActive = minPrice === preset.min && maxPrice === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => onPriceChange(preset.min, preset.max)}
                className={`w-full border-2 border-[#3D2419] px-2.5 py-1.5 text-xs shadow-[2px_2px_0px_0px_#3D2419] transition-colors cursor-pointer lg:w-auto ${
                  isActive ? "bg-[#3D2419] text-white" : "bg-white hover:bg-[#FBDF58]"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setIsCustomPriceOpen((value) => !value)}
            aria-expanded={isCustomPriceOpen}
            className={`w-full border-2 border-[#3D2419] px-2.5 py-1.5 text-xs shadow-[2px_2px_0px_0px_#3D2419] transition-colors cursor-pointer lg:w-auto ${
              isCustomPriceOpen ? "bg-[#FFD3B6]" : "bg-white hover:bg-[#FBDF58]"
            }`}
          >
            自訂價格 {isCustomPriceOpen ? "▴" : "▾"}
          </button>
        </div>

        {isCustomPriceOpen && (
          <div className="mt-1 w-full border-t-2 border-dashed border-[#3D2419]/20 pt-3">
            <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2 lg:max-w-lg">
              <label className="flex min-w-0 flex-col gap-1 text-xs text-[#3D2419]/80">
                <span>最低金額</span>
                <input
                  type="number"
                  min="0"
                  max={priceMax}
                  inputMode="numeric"
                  value={minStr}
                  onChange={(e) => handlePriceInput("min", e.target.value)}
                  onBlur={applyInput}
                  onKeyDown={(e) => e.key === "Enter" && applyInput()}
                  className="h-9 w-full border-[2px] border-[#3D2419] bg-white px-2 text-center text-sm outline-none focus:ring-2 focus:ring-[#FBDF58]"
                />
              </label>
              <span className="pb-2 text-sm text-[#3D2419]/60">～</span>
              <label className="flex min-w-0 flex-col gap-1 text-xs text-[#3D2419]/80">
                <span>最高金額</span>
                <input
                  type="number"
                  min="0"
                  max={priceMax}
                  inputMode="numeric"
                  value={maxStr}
                  onChange={(e) => handlePriceInput("max", e.target.value)}
                  onBlur={applyInput}
                  onKeyDown={(e) => e.key === "Enter" && applyInput()}
                  className="h-9 w-full border-[2px] border-[#3D2419] bg-white px-2 text-center text-sm outline-none focus:ring-2 focus:ring-[#FBDF58]"
                />
              </label>
              <span className="col-span-3 text-xs font-normal text-[#3D2419]/50">
                輸入後即時篩選，可輸入 $0～${priceMax.toLocaleString()}
              </span>
            </div>

            <div className="hidden w-full max-w-lg items-center gap-2 lg:flex">
              <span className="text-xs text-[#3D2419]/80 w-10 text-right">${slideMin}</span>
              <div className="relative flex-1 h-6">
                <div className="absolute top-1/2 -translate-y-1/2 w-full h-2 bg-[#3D2419]/20" />
                <div className="absolute top-1/2 -translate-y-1/2 h-2 bg-[#3D2419]"
                  style={{ left: `${(slideMin / priceMax) * 100}%`, width: `${((slideMax - slideMin) / priceMax) * 100}%` }} />
                <input type="range" min={0} max={priceMax} step={1} value={slideMin}
                  onChange={(e) => handleSlider("min", Number(e.target.value))}
                  className="absolute top-0 w-full h-full appearance-none bg-transparent pointer-events-none
                    [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-[#FF6B6B] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#3D2419]
                    [&::-webkit-slider-thumb]:shadow-[1px_1px_0px_0px_#3D2419] [&::-webkit-slider-thumb]:cursor-pointer" />
                <input type="range" min={0} max={priceMax} step={1} value={slideMax}
                  onChange={(e) => handleSlider("max", Number(e.target.value))}
                  className="absolute top-0 w-full h-full appearance-none bg-transparent pointer-events-none
                    [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-[#FF6B6B] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#3D2419]
                    [&::-webkit-slider-thumb]:shadow-[1px_1px_0px_0px_#3D2419] [&::-webkit-slider-thumb]:cursor-pointer" />
              </div>
              <span className="text-xs text-[#3D2419]/80 w-10">${slideMax}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
