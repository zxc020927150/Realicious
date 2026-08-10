"use client";

import {
  FaUser,
  FaBook,
  FaBookmark,
  FaShoppingCart,
  FaTicketAlt,
  FaHeart,
} from "react-icons/fa";
import { AiFillSafetyCertificate } from "react-icons/ai";
import { MdOutlineLogout } from "react-icons/md";
import { FaXmark } from "react-icons/fa6";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-regular-svg-icons";
import defaultAvatar from "@/public/user/Avatar.png";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useUser } from "@/app/context/user";
import Link from "next/link";
import Image from "next/image";
import { useAlert } from "@/app/user/context/alert";

// 💡 建立一個檢查 Client 端的 Hook
const emptySubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true, // Client 端回傳 true
    () => false, // Server 端 (SSR) 回傳 false
  );
}

export default function UserSidebar() {
  const { user, logout } = useUser();
  const { showAlert } = useAlert();
  const isMounted = useIsClient(); // 💡 乾淨取代 useEffect + useState

  const [isOpening, setIsOpening] = useState<boolean>(false);
  const headerAvatar = user?.avatar ? `${user.avatar}` : defaultAvatar;

  return (
    <>
      {/* 觸發按鈕：留在 Header 內保持原本位置 */}
      <button
        onClick={() => setIsOpening(!isOpening)}
        className="p-2 text-white hover:cursor-pointer"
      >
        <FontAwesomeIcon icon={faUser} className="text-xl" />
      </button>

      {/* 💡 步驟 2：使用 createPortal 將側邊欄和遮罩「傳送」到 body */}
      {isMounted &&
        createPortal(
          <>
            <div
              className={`fixed z-50 top-0 right-0 w-80 sm:w-90 bg-[#FCF9F6] h-full shadow-2xl ${
                isOpening ? "translate-x-0" : "translate-x-full"
              } transition-transform duration-300 ease-in-out`}
            >
              <div className="">
                <div className="flex items-center bg-gray-100">
                  {/* 「X」關閉按鈕 */}
                  <button
                    onClick={() => setIsOpening(false)}
                    className="absolute top-4 right-4 p-2 text-gray-500 hover:text-black hover:bg-gray-200/50 rounded-full cursor-pointer transition-colors"
                    aria-label="Close sidebar"
                  >
                    <FaXmark className="text-2xl" />
                  </button>
                  <div className="w-25 h-25 ml-6 mr-2 my-6 rounded-full">
                    <Image
                      src={headerAvatar}
                      alt="avatar"
                      width={100}
                      height={100}
                      className="w-full h-full object-cover rounded-full"
                      unoptimized
                    />
                  </div>
                  <div className="ml-2">
                    <p className="mb-2 text-bold text-xl">{user?.nick_name || "訪客"}</p>
                    <p className="hidden sm:block text-[14px]">{user?.account || ""}</p>
                  </div>
                </div>

                <div className="bg-[#FCF9F6]">
                  <Link
                    onClick={() => setIsOpening(false)}
                    className="w-full h-12.5 text-left pl-8 cursor-pointer hover:bg-[#FBDF58] flex items-center"
                    href={`/user/account`}
                  >
                    <FaUser />
                    <span className="ml-4">個人資料</span>
                  </Link>
                  <Link
                    onClick={() => setIsOpening(false)}
                    className="w-full h-12.5 text-left pl-8 cursor-pointer hover:bg-[#FBDF58] flex items-center"
                    href={`/user/account/password`}
                  >
                    <AiFillSafetyCertificate />
                    <span className="ml-4">帳戶安全</span>
                  </Link>
                  <Link
                    onClick={() => setIsOpening(false)}
                    className="w-full h-12.5 text-left pl-8 cursor-pointer hover:bg-[#FBDF58] flex items-center"
                    href={`/user/account/orders`}
                  >
                    <FaShoppingCart />
                    <span className="ml-4">訂單記錄</span>
                  </Link>
                  <Link
                    onClick={() => setIsOpening(false)}
                    className="w-full h-12.5 text-left pl-8 cursor-pointer hover:bg-[#FBDF58] flex items-center"
                    href={`/user/account/tickets`}
                  >
                    <FaTicketAlt />
                    <span className="ml-4">票券中心</span>
                  </Link>
                  <Link
                    onClick={() => setIsOpening(false)}
                    className="w-full h-12.5 text-left pl-8 cursor-pointer hover:bg-[#FBDF58] flex items-center"
                    href={`/user/account/favorites`}
                  >
                    <FaHeart />
                    <span className="ml-4">商品收藏</span>
                  </Link>
                   <Link
                    onClick={() => setIsOpening(false)}
                    className="w-full h-12.5 text-left pl-8 cursor-pointer hover:bg-[#FBDF58] flex items-center"
                    href={`/user/account/article`}
                  >
                    <FaBook />
                    <span className="ml-4">我的文章</span>
                  </Link>
                  <Link
                    onClick={() => setIsOpening(false)}
                    className="w-full h-12.5 text-left pl-8 cursor-pointer hover:bg-[#FBDF58] flex items-center"
                    href={`/user/account/saved-articles`}
                  >
                    <FaBookmark />
                    <span className="ml-4">文章收藏</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsOpening(false);
                      showAlert("confirm", "確定要登出嗎？", "", () => {
                        logout();
                      });
                    }}
                    className="w-full h-12.5 text-red-600 border-gray-700 text-left pl-8 cursor-pointer hover:bg-[#FBDF58] flex items-center"
                  >
                    <MdOutlineLogout />
                    <span className="ml-4">登出</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 遮罩 */}
            <div
              onClick={() => setIsOpening(false)}
              className={`fixed inset-0 bg-black/40 z-40 ${isOpening ? "" : "hidden"}`}
            ></div>
          </>,
          document.body, // 💡 傳送到 body 節點下
        )}
    </>
  );
}
