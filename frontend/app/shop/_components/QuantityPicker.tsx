import React, { useState } from "react";

export default function QuantityPicker({ max = 99, value, onChange, onReachMin }: { max?: number; value?: number; onChange?: (val: number) => void; onReachMin?: () => void }) {
  const [qty, setQty] = useState(1);

  const current = value ?? qty;

  const dec = () => {
    if (current <= 1) {
      if (onReachMin) onReachMin();
      return;
    }
    const next = current - 1;
    if (onChange) onChange(next);
    else setQty(next);
  };
  const inc = () => {
    const next = Math.min(max, current + 1);
    if (onChange) onChange(next);
    else setQty(next);
  };

  const btnClass = "flex items-center justify-center w-10 h-10 \
                    bg-[#FCF9F6] text-[#3D2419] font-bold text-lg \
                    border-[3px] border-[#3D2419] \
                    shadow-[2px_2px_0px_0px_#3D2419] select-none \
                    cursor-pointer hover:bg-[#FFD3B6] transition-colors";

  const numClass = "flex items-center justify-center w-12 h-10 \
                    bg-white text-[#3D2419] font-bold text-base \
                    border-y-[3px] border-[#3D2419] \
                    shadow-[2px_2px_0px_0px_#3D2419] select-none";

  return (
    <div className="flex items-center">
      <div className={btnClass} onClick={dec}>-</div>
      <div className={numClass}>{current}</div>
      <div className={btnClass} onClick={inc}>+</div>
    </div>
  );
}
