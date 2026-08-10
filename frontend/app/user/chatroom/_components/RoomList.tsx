import { Room } from "../hooks/useChatroom";
import Image from "next/image";
import CreateRoomModal from "./CreateRoomForm";
import { useAlert } from "@/app/user/context/alert";
import { useToast } from "@/app/user/_components/Toast";

interface RoomListProps {
  rooms: Room[];
  activeTab: "all" | "favorites";
  onTabChange: (tab: "all" | "favorites") => void;
  currentRoomId?: number;
  currentUserId: number;
  onJoinRoom: (room: Room) => void;
  onDeleteRoom: (roomId: number, e: React.MouseEvent) => void;
  onToggleFavorite: (roomId: number, e: React.MouseEvent) => void; // 🌟 補上介面定義
  createRoom:(
    name: string,
    type: "PUBLIC_GROUP" | "PRIVATE_GROUP",
    imageUrl?: string,
    password?: string
  ) =>Promise<{ success: boolean; message?: string }>
  classroom?:string
}

/* 預設圖庫備用網址 */
const DEFAULT_COVER = "/user/chatroom/apple.png";

export default function RoomList({
  rooms,
  activeTab,
  onTabChange,
  currentRoomId,
  currentUserId,
  onJoinRoom,
  onDeleteRoom,
  onToggleFavorite,
  createRoom,
  classroom
}: RoomListProps) {
  const { showAlert } = useAlert();
  const { showToast } = useToast()

  return (
    <div className={`${classroom} w-full sm:w-750 sm:flex flex-[1.4] flex-col border-gray-600 bg-white/0 sm:bg-slate-50/50 p-2.5 md:p-5 min-h-0`}>
      {/* 大廳 Header */}
      <div className="mb-2 md:mb-4 flex items-center justify-between gap-1">
        <div>
          <h2 className="text-base md:text-xl font-bold text-slate-800 shrink-0">
            聊天大廳
          </h2>
          <p className="text-[10px] md:text-xs text-slate-500 hidden sm:block">
            探索感興趣的房間，即時加入對話
          </p>
        </div>

        {/* 頁籤 */}
        <div className="flex bg-slate-200/70 p-0.5 md:p-1 text-[11px] md:text-xs shrink-0">
          <button
            type="button"
            onClick={() => onTabChange("all")}
            className={`cursor-pointer px-2 md:px-3 py-1 font-medium transition-all ${
              activeTab === "all"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            所有房間
          </button>
          <button
            type="button"
            onClick={() =>{ onTabChange("favorites")}}
            className={`cursor-pointer mr-3 px-2 md:px-3 py-1 font-medium transition-all ${
              activeTab === "favorites"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            已追蹤 ❤️
          </button>
          <CreateRoomModal onCreateRoom={createRoom} />
        </div>
      </div>

      {/* 房間卡片列表 */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col">
        {rooms.length === 0 ? (
          <div className="flex flex-1 w-175 flex-col items-center justify-center text-slate-400 py-10">
            <span className="text-3xl mb-2">❤️</span>
            <p className="text-xs ">
              {activeTab === "favorites" ? "尚未追蹤任何房間" : "目前沒有房間"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
            {rooms.map((room) => {
              const isSelected = currentRoomId === room.id;
              const isOwner = currentUserId === room.createdBy;

              return (
                <div
                  key={room.id}
                  onClick={() => {onJoinRoom(room);showToast(`加入房間：${room.name}`)}}
                  className={`group relative flex flex-col overflow-hidden border bg-white cursor-pointer transition-all hover:shadow-md ${
                    isSelected
                      ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-md"
                      : "border-slate-200 hover:border-indigo-300"
                  }`}
                >
                  {/* 房間圖片區 */}
                  <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                    <Image
                      src={room.imageUrl || DEFAULT_COVER}
                      alt={room.name}
                      width={200}
                      height={170}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={(e) =>{onToggleFavorite(room.id, e);showToast(room.isFavorited ? "🤍取消追蹤" : "❤️追蹤房間")}}
                      className="cursor-pointer absolute top-1.5 right-1.5 md:top-2 md:right-2 rounded-full bg-black/40 backdrop-blur-md p-1.5 text-xs transition-transform active:scale-125 hover:bg-black/60"
                      title={room.isFavorited ? "取消追蹤" : "追蹤房間"}
                    >
                      {room.isFavorited ? "❤️" : "🤍"}
                    </button>

                    {room.type === "PRIVATE_GROUP" && (
                      <span className="absolute top-1.5 left-1.5 md:top-2 md:left-2 rounded bg-black/60 backdrop-blur-md px-1 py-0.5 text-[9px] md:text-[10px] text-white">
                        🔒
                      </span>
                    )}
                    <span className="absolute bottom-1.5 right-1.5 md:bottom-2 md:right-2 bg-white/90 backdrop-blur-md px-1.5 py-0.5 text-[9px] md:text-[10px] font-semibold text-slate-700 shadow-sm">
                      🟢 {room._count?.members || 0} 人
                    </span>
                  </div>

                  {/* 卡片內容 */}
                  <div className="flex flex-1 items-center justify-between p-2 md:p-3">
                    <h3 className="font-bold text-xs md:text-sm text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {room.name}
                    </h3>

                    {isOwner && (
                      <button
                        type="button"
                        onClick={(e) => {
                          showAlert(
                            "confirm",
                            "注意!",
                            "確定要刪除這個房間嗎？此動作無法復原！",
                            () => {
                              onDeleteRoom(room.id, e);
                            },
                          );
                        }}
                        className="cursor-pointer rounded px-1 text-[10px] md:text-xs font-medium text-red-500 hover:bg-red-50 shrink-0 ml-1"
                      >
                        刪除
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
