import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  FaUser,
  FaBook,
  FaBookmark,
  FaClipboardList,
  FaTicketAlt,
  FaHeart,
} from "react-icons/fa";
import { AiFillSafetyCertificate } from "react-icons/ai";

export default function Left() {
  const pathname = usePathname();
  const menuItems = [
    { name: "個人資料", path: "/user/account", icon: FaUser },
    { name: "帳戶安全", path: "/user/account/password", icon: AiFillSafetyCertificate },
    { name: "訂單紀錄", path: "/user/account/orders", icon: FaClipboardList },
    { name: "票券中心", path: "/user/account/tickets", icon: FaTicketAlt },
    { name: "商品收藏", path: "/user/account/favorites", icon: FaHeart },
    { name: "我的文章", path: "/user/account/article", icon: FaBook },
    { name: "文章收藏", path: "/user/account/saved-articles", icon: FaBookmark },
  ];

  const getLinkStyle = (path: string) => {
    const isActive = pathname === path;
    return isActive
      ? "bg-[#FBDF58] font-bold"
      : "bg-[#FCF9F6] hover:bg-[#faea99]";
  };

  return (
    <>
      {/* 
        ==================================================
        手機版
        ==================================================
      */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#FCF9F6] border-t-2 border-black shadow-[0px_-2px_0px_0px_rgba(0,0,0,1)] md:hidden">
        <div className="flex overflow-x-auto whitespace-nowrap p-2 gap-2 scrollbar-none">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center justify-center min-w-[76px] py-2 px-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs shrink-0 ${getLinkStyle(
                  item.path
                )}`}
              >
                <Icon className="text-base mb-1" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 
        ==================================================
        電腦版
        ==================================================
      */}
      <div className="hidden md:flex w-95 h-170 bg-[#FCF9F6] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex-col items-center">
        <h2 className="text-[24px] my-4 font-bold">會員中心</h2>
        <div className="w-full">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                className={`w-full h-12.5 text-left pl-8 flex items-center transition-colors ${getLinkStyle(
                  item.path
                )}`}
                href={item.path}
              >
                <Icon className="text-lg" />
                <span className="ml-4">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
