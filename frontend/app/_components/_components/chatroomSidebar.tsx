"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import Cookies from "js-cookie";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMessage } from "@fortawesome/free-regular-svg-icons";
import { FaXmark, FaStar, FaCrown } from "react-icons/fa6";
import { FcLike } from "react-icons/fc";
import { FaArrowRight } from "react-icons/fa";


// 💡 補強型別定義：對應後端回傳的欄位
interface RoomSummary {
  id: number;
  name: string | null;
  imageUrl: string | null;
  type: "DIRECT" | "PUBLIC_GROUP" | "PRIVATE_GROUP";
  onlineCount?: number;
  _count?: {
    members?: number;
    onlineMembers?: number;
  };
  messages?: { content: string; createdAt: string }[];
}

const emptySubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_URL = `${BASE_URL}/user/api`;

export default function Chatroom() {
  const [isOpening, setIsOpening] = useState<boolean>(false);
  const [favoriteRooms, setFavoriteRooms] = useState<RoomSummary[]>([]);
  const [createdRooms, setCreatedRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const isMounted = useIsClient();

  // 當側邊欄開啟時才去抓取 API 資料
  useEffect(() => {
    const fetchChatroom = async () => {
      const token = Cookies.get("token");
      setLoading(true);

      try {
        const res = await fetch(`${API_URL}/chatrooms/sidebar`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const result = await res.json();

        if (res.ok && result.success) {
          // 💡 寫入後端回傳的 favorites 與 created 陣列
          setFavoriteRooms(result.data.favorites || []);
          setCreatedRooms(result.data.created || []);
        } else {
          console.error("無法取得聊天室清單:", result.message);
        }
      } catch (error) {
        console.error("發送請求失敗:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpening) {
      fetchChatroom();
    }
  }, [isOpening]);

  // 渲染單個房間卡片元件
  const renderRoomItem = (room: RoomSummary) => {
    const lastMsg = room.messages?.[0]?.content || "尚無訊息";
    const displayName = room.name || `聊天室 #${room.id}`;
    const online = room.onlineCount ?? 0;

    return (
      <Link
        key={room.id}
        href={`/user/chatroom/?roomId=${room.id}`}
        onClick={() => setIsOpening(false)}
        className="w-full p-3 mb-2 flex items-center gap-3 hover:bg-gray-100 rounded-xl transition-colors border border-transparent hover:border-gray-200 group"
      >
        {/* 預覽頭像 */}
        <div className="relative w-11 h-11 shrink-0 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center font-bold overflow-hidden ">
          {room.imageUrl ? (
            <Image
              src={room.imageUrl}
              alt={displayName}
              fill
              className="object-cover"
            />
          ) : (
            displayName.slice(0, 2)
          )}
        </div>

        {/* 名稱與最後訊息 */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate text-sm">
            {displayName}
          </p>
        </div>

        {/* 💡 顯示線上人數 (若有人在線上顯示綠點與人數) */}
        {online > 0 && (
          <div className="flex items-center gap-1.5 shrink-0 bg-green-50 px-2 py-1 rounded-full border border-green-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-medium text-emerald-700">
              {online}
            </span>
          </div>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* 觸發按鈕 */}
      <button
        onClick={() => setIsOpening(!isOpening)}
        className="p-2 text-white hover:cursor-pointer"
      >
        <FontAwesomeIcon icon={faMessage} className="text-xl" />
      </button>

      {/* Portal 渲染側邊欄 */}
      {isMounted &&
        createPortal(
          <>
            {/* 側邊欄抽屜 */}
            <div
              className={`fixed z-50 top-0 right-0 w-80 md:w-90 bg-[#FCF9F6] h-full shadow-2xl ${
                isOpening ? "translate-x-0" : "translate-x-full"
              } transition-transform duration-300 ease-in-out`}
            >
              <div className="pt-14 relative h-full flex flex-col ">
                <div className="mb-8">
                  {/* 關閉按鈕 */}
                  <button
                    onClick={() => setIsOpening(false)}
                    className="absolute top-4 right-4 p-2 text-gray-500 hover:text-black hover:bg-gray-200/50 rounded-full cursor-pointer transition-colors"
                    aria-label="Close chatroom"
                  >
                    <FaXmark className="text-2xl" />
                  </button>

                  <Link
                    href="/user/chatroom"
            className=" gap-2 mr-4 ml-4 flex items-center font-bold text-[#BB0015] border-b-2 border-[#BB0015] hover:text-[#8E0010] hover:border-[#8E0010] transition"
        onClick={() => setIsOpening(!isOpening)}
                  >
                    聊天室大廳<FaArrowRight />

                  </Link>
                </div>

                {/* 列表內容區 */}
                <div className="overflow-y-auto grow px-4 pb-6 space-y-6">
                  {loading ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      載入中...
                    </div>
                  ) : (
                    <>
                      {/* 1. 追蹤的聊天室 */}
                      <div>
                        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-400 tracking-wider uppercase px-1">
                          <FcLike className="text-amber-500" />
                          <span>追蹤的聊天室</span>
                          <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px]">
                            {favoriteRooms.length}
                          </span>
                        </div>
                        {favoriteRooms.length > 0 ? (
                          favoriteRooms.map(renderRoomItem)
                        ) : (
                          <p className="text-xs text-gray-400 px-1 py-2">
                            尚未追蹤任何聊天室
                          </p>
                        )}
                      </div>

                      {/* 2. 我建立的聊天室 */}
                      <div>
                        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-400 tracking-wider uppercase px-1">
                          <FaCrown className="text-amber-600" />
                          <span>我建立的聊天室</span>
                          <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px]">
                            {createdRooms.length}
                          </span>
                        </div>
                        {createdRooms.length > 0 ? (
                          createdRooms.map(renderRoomItem)
                        ) : (
                          <p className="text-xs text-gray-400 px-1 py-2">
                            你還沒有建立過聊天室
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 遮罩 */}
            <div
              onClick={() => setIsOpening(false)}
              className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${
                isOpening ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            ></div>
          </>,
          document.body,
        )}
    </>
  );
}
