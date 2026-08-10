"use client";

import { useUser } from "@/app/context/user";
import { useChatroom } from "./hooks/useChatroom";
import { useSearchParams } from "next/navigation";
import Container from "@/app/user/_components/container";

import RoomList from "./_components/RoomList";
import CreateRoomForm from "./_components/CreateRoomForm";
import CreateRoomModal from "./_components/CreateRoomForm";
import ChatWindow from "./_components/ChatWindow";
import PasswordModal from "./_components/PasswordModal";

export default function Chatroom() {
  const { user, loading } = useUser();
  const searchParams = useSearchParams();
  const hasRoomId = Boolean(searchParams.get("roomId"));

  const {
    currentRoom,
    messages,
    passwordModalRoom,
    filteredRooms,
    activeTab,
    setActiveTab,
    setPasswordModalRoom,
    createRoom,
    joinRoom,
    sendMessage,
    leaveRoom,
    deleteRoom,
    toggleFavorite,
  } = useChatroom();

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">載入中...</div>
    );
  if (!user)
    return (
      <div className="flex h-screen items-center justify-center">請先登入</div>
    );

  const currentUserId = Number(user.id);

  return (
    <Container className=" py-0 sm:py-2 md:py-6 overflow-x-auto">
      <div
        className={`bg-white/0 sm:bg-white/50 flex flex-col w-screen sm:flex-row h-dvh sm: sm:min-w-[640px] xl:h-[600px] 2xl:h-[750px] gap-2 md:gap-6 sm:border-3 sm:border-gray-500`}
      >
        {/* 左側：大廳 */}
          <RoomList
            rooms={filteredRooms} /* 傳入過濾後的資料庫清單 */
            activeTab={activeTab} /*  頁籤狀態 */
            onTabChange={setActiveTab} /* 頁籤切換事件 */
            currentRoomId={currentRoom?.id}
            currentUserId={currentUserId}
            onJoinRoom={(room) => joinRoom(room.id)} //傳入房間id
            onDeleteRoom={deleteRoom}
            onToggleFavorite={toggleFavorite} /*  傳入追蹤函式 */
            createRoom={createRoom}
            classroom={hasRoomId ? "hidden" : ""}
          />
        

        {/* 右側：控制台 & 聊天室 */}
        <div
          className={`${hasRoomId ? "" : "hidden"} sm:flex flex-1 flex-col gap-2 h-screen sm:h-full md:gap-4 shrink-0`}
        >
          <ChatWindow
            currentRoom={currentRoom}
            messages={messages}
            currentUserId={currentUserId}
            onSendMessage={sendMessage}
            onLeaveRoom={leaveRoom}
          />
        </div>
      </div>

      {/* 彈窗 */}
      {passwordModalRoom && (
        <PasswordModal
          roomName={passwordModalRoom.name}
          onSubmit={(pwd) => joinRoom(passwordModalRoom.id, pwd)}
          onClose={() => setPasswordModalRoom(null)}
        />
      )}
    </Container>
  );
}
