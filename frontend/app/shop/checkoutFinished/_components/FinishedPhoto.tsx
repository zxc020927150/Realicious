import React from "react";
import PetSprite from "@/app/accounting/pixel/PixelSpriteSheet";
import "@/app/accounting/pixel/fx.css";

export default function FinishedPhoto() {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-end justify-center w-full h-36 mb-4 overflow-hidden">
        <div className="shop-confetti absolute left-1/2 top-5" style={{ "--confetti-x": "-7.5rem" } as React.CSSProperties} aria-hidden>
          <span className="absolute left-2 top-0 w-2.5 h-2.5 bg-[#FFD45C] border border-[#1A1721]" />
          <span className="absolute left-0 top-3 w-2.5 h-2.5 bg-[#FFD45C] border border-[#1A1721]" />
          <span className="absolute left-4 top-3 w-2.5 h-2.5 bg-[#BB0015] border border-[#1A1721]" />
          <span className="absolute left-2 top-6 w-2.5 h-2.5 bg-[#FFD45C] border border-[#1A1721]" />
        </div>
        <div className="shop-confetti shop-confetti-delay absolute left-1/2 top-10" style={{ "--confetti-x": "5rem" } as React.CSSProperties} aria-hidden>
          <span className="absolute left-2 top-0 w-2.5 h-2.5 bg-[#BB0015] border border-[#1A1721]" />
          <span className="absolute left-0 top-3 w-2.5 h-2.5 bg-[#FFD45C] border border-[#1A1721]" />
          <span className="absolute left-4 top-3 w-2.5 h-2.5 bg-[#FFD45C] border border-[#1A1721]" />
          <span className="absolute left-2 top-6 w-2.5 h-2.5 bg-[#BB0015] border border-[#1A1721]" />
        </div>
        <PetSprite mood="happy" size={128} />
      </div>
    </div>
  );
}
