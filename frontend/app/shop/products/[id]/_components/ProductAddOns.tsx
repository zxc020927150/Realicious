import React from "react";

export default function ProductAddOns() {
  return (
    <div>
      <div>
        <span>加購區</span>
      </div>
      <div className="inline-flex flex-col gap-3">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 
                      bg-[#FCF9F6] text-[#3D2419] font-bold text-sm
                      border-[3px] border-[#3D2419]
                      shadow-[2px_2px_0px_0px_#3D2419] select-none
                  "
        >
          <button>
          口 西瓜檸檬冰沙餐券(+＄價格)
          </button>
        </div>
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 
                      bg-[#FCF9F6] text-[#3D2419] font-bold text-sm
                      border-[3px] border-[#3D2419]
                      shadow-[2px_2px_0px_0px_#3D2419] select-none
                  "
        >
          <button>
          口 木瓜檸檬冰沙餐券(+＄價格)
          </button>
        </div>
      </div>
    </div>
  );
}
