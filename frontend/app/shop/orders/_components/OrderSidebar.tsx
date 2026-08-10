import React from "react";

export default function OrderSidebar() {
  return (
    <div>
      <div
        className="flex flex-col w-full px-4 py-2.5
                  bg-[#FCF9F6] text-[#3D2419] font-bold text-base
                  border-[3px] border-[#3D2419]
                  shadow-[4px_4px_0px_0px_#3D2419]
                  "
      >
        <div className="flex flex-row items-center">
          {/* 個人頭像 */}
          <div className="bg-[#FFF0B8] w-20 h-20">個人頭像</div>
          {/* 名字 */}
          <div className="ml-8">
            <span className="text-xl">[user.name]</span>
          </div>
        </div>
        <hr className="border-t-4 w-full mx-auto mt-2 border-gray-600 " />
        <div className="">
          <div
            className="flex items-center justify-center w-full px-4 py-2.5 mt-8
                  bg-[#89502E] text-[#FFFFFF] font-bold text-base
                  border-[3px] border-[#3D2419]
                  shadow-[4px_4px_0px_0px_#3D2419]
                  "
          >
            <button>全部訂單 / All Orders</button>
          </div>
          <div className="flex items-center justify-center w-full px-4 py-2.5 mt-12
                  text-[#52443C] font-bold text-base">
            <button>處理中 / In Progress</button>
          </div>
          <div
            className="flex items-center justify-center w-full px-4 py-2.5 mt-12
                  text-[#52443C] font-bold text-base"
          >
            <button>已完成 / Completed</button>
          </div>
          <div
            className="flex items-center justify-center w-full px-4 py-2.5 mt-12 mb-8
                text-[#52443C] font-bold text-base"
          >
            <button className="mr-3.5">歷史紀錄 / History</button>
          </div>
        </div>
      </div>
    </div>
  );
}
