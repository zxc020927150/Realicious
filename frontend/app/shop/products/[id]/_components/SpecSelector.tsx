import React, { useState } from "react";

export default function SpecSelector() {
  const specs = ["單人套餐", "雙人套餐", "十人套餐"];
  const [selected, setSelected] = useState(specs[0]);

  return (
    <div>
      <div>
        <span>規格/方案</span>
      </div>
      <div className="flex items-center grid-cols-3 gap-3">
        {specs.map((spec) => {
          const isActive = selected === spec;
          return (
            <div key={spec}
              onClick={() => setSelected(spec)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 
                          font-bold text-sm border-[3px] border-[#3D2419]
                          shadow-[2px_2px_0px_0px_#3D2419] select-none cursor-pointer
                          transition-colors
                          ${isActive ? "bg-[#3D2419] text-white" : "bg-[#FCF9F6] text-[#3D2419] hover:bg-[#FFD3B6]"}`}
            >
              {spec}
            </div>
          );
        })}
      </div>
    </div>
  );
}
