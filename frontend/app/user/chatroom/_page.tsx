"use client";
import { useState, useEffect, useRef } from "react";
import { useUser } from "@/app/context/user";
import { Socket, io } from "socket.io-client";
import Cookies from "js-cookie";

import Container from "@/app/user/_components/container";

interface Room {
  id: number;
  name: string;
  type: string;
  createdBy: number;
  imageUrl?: string;
  _count?: { members: number };
}

interface Message {
  id?: number;
  senderId: number;
  content: string;
  sender?: { id: number; account: string };
}

export default function Chatroom() {
  const { user, loading } = useUser();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);

  // 頁籤過濾
  const [activeTab, setActiveTab] = useState<"all" | "favorites">("all");

  // 表單 State
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomType, setNewRoomType] = useState<
    "PUBLIC_GROUP" | "PRIVATE_GROUP"
  >("PUBLIC_GROUP");
  const [newRoomPassword, setNewRoomPassword] = useState("");

  // 私密房彈窗 State
  const [passwordModalRoom, setPasswordModalRoom] = useState<Room | null>(null);
  const [inputPassword, setInputPassword] = useState("");

  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const currentUserId = user?.id ? Number(user.id) : null;
  const socketRef = useRef<Socket | null>(null);

  // 置底 Ref
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket 初始化
  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) return;

    socketRef.current = io("http://localhost:3001", {
      auth: { token },
    });

    const socket = socketRef.current;

    socket.on("receive_message", (newMessage: Message) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    socket.on("load_history", (historyMessages: Message[]) => {
      setMessages(historyMessages);
      setTimeout(() => scrollToBottom("auto"), 50);
    });

    socket.on("room_created", (newRoom: Room) => {
      setRooms((prev) => [newRoom, ...prev]);
    });

    socket.on(
      "room_member_updated",
      ({ roomId, memberCount }: { roomId: number; memberCount: number }) => {
        setRooms((prevRooms) =>
          prevRooms.map((room) => {
            if (room.id === roomId) {
              return {
                ...room,
                _count: { members: memberCount },
              };
            }
            return room;
          })
        );
      }
    );

    socket.on("join_success", ({ room }: { room: Room }) => {
      setCurrentRoom(room);
      setPasswordModalRoom(null);
      setInputPassword("");
    });

    socket.on("password_required", ({ roomId }: { roomId: number }) => {
      setRooms((latestRooms) => {
        const target = latestRooms.find((r) => r.id === roomId);
        if (target) {
          setPasswordModalRoom(target);
        }
        return latestRooms;
      });
    });

    socket.on("error_message", (data: { message: string }) => {
      alert(data.message);
    });

    socket.on("room_deleted", ({ roomId }: { roomId: number }) => {
      setRooms((prevRooms) => prevRooms.filter((room) => room.id !== roomId));

      setCurrentRoom((prevCurrent) => {
        if (prevCurrent && prevCurrent.id === roomId) {
          alert("該房間已被建立者刪除！");
          return null;
        }
        return prevCurrent;
      });
    });

    return () => {
      socket.off("receive_message");
      socket.off("load_history");
      socket.off("room_created");
      socket.off("room_member_updated");
      socket.off("join_success");
      socket.off("error_message");
      socket.off("password_required");
      socket.off("room_deleted");
      socket.disconnect();
    };
  }, []);

  const fetchRooms = async () => {
    const token = Cookies.get("token");
    try {
      const res = await fetch("http://localhost:3001/user/api/chatrooms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) setRooms(result.data);
    } catch (err) {
      console.error("獲取房間清單失敗:", err);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchRooms();
    };
    loadInitialData();
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    if (newRoomType === "PRIVATE_GROUP" && !newRoomPassword.trim()) {
      alert("建立私密房間時請設定密碼！");
      return;
    }

    const token = Cookies.get("token");
    try {
      const res = await fetch("http://localhost:3001/user/api/chatrooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newRoomName,
          type: newRoomType,
          password: newRoomPassword,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setNewRoomName("");
        setNewRoomPassword("");
        setNewRoomType("PUBLIC_GROUP");
      } else {
        alert(result.message || "建立房間失敗");
      }
    } catch (err) {
      console.error("建立房間失敗:", err);
    }
  };

  const handleJoinRoom = (room: Room) => {
    if (!socketRef.current) return;
    if (!socketRef.current.connected) {
      socketRef.current.connect();
    }
    setMessages([]);
    socketRef.current.emit("join_room", { roomId: room.id });
  };

  const handleSubmitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalRoom || !socketRef.current || !inputPassword.trim())
      return;

    socketRef.current.emit("join_room", {
      roomId: passwordModalRoom.id,
      password: inputPassword,
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !socketRef.current || !currentRoom) return;

    socketRef.current.emit("send_message", {
      roomId: currentRoom.id,
      content: messageInput,
    });

    setMessageInput("");
  };

  const handleDeleteRoom = async (roomId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("確定要刪除這個房間嗎？此動作無法復原！")) return;

    const token = Cookies.get("token");
    try {
      const res = await fetch(
        `http://localhost:3001/user/api/chatrooms/${roomId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await res.json();
      if (!result.success) {
        alert(result.message);
      }
    } catch (err) {
      console.error("刪除房間失敗:", err);
    }
  };

  const handleLeaveRoom = () => {
    if (!currentRoom || !socketRef.current) return;
    socketRef.current.emit("leave_room", { roomId: currentRoom.id });
    setCurrentRoom(null);
    setMessages([]);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        載入使用者資料中...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        請先登入以使用聊天室
      </div>
    );
  }

  return (
    <Container className="py-2 md:py-6 overflow-x-auto">
      {/* 
        🌟 固定左右佈局（flex-row）：
        - 始終維持雙欄排版
        - 設定 min-w-[640px]，防止螢幕過窄時文字與卡片變形
      */}
      <div className="flex flex-row h-[600px] md:h-[750px] gap-2 md:gap-6 min-w-[640px]">
        
        {/* 👈 左側：聊天大廳（佔 58% 寬度） */}
        <div className="flex flex-[1.4] flex-col rounded-xl md:rounded-2xl border border-slate-200 bg-slate-50/50 p-2.5 md:p-5 shadow-sm">
          {/* 大廳 Header */}
          <div className="mb-2 md:mb-4 flex items-center justify-between gap-1">
            <div>
              <h2 className="text-base md:text-xl font-bold text-slate-800">聊天大廳</h2>
              <p className="text-[10px] md:text-xs text-slate-500 hidden sm:block">探索感興趣的房間，即時加入對話</p>
            </div>

            {/* 頁籤 */}
            <div className="flex rounded-lg bg-slate-200/70 p-0.5 md:p-1 text-[11px] md:text-xs shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`rounded-md px-2 md:px-3 py-1 font-medium transition-all ${
                  activeTab === "all"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                所有房間
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("favorites")}
                className={`rounded-md px-2 md:px-3 py-1 font-medium transition-all ${
                  activeTab === "favorites"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                喜愛 ❤️
              </button>
            </div>
          </div>

          {/* 🌟 欄位動態轉換：手機一排1個、平板一排2個、桌機一排3個 */}
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
              {rooms.map((room) => {
                const isSelected = currentRoom?.id === room.id;
                const isOwner = currentUserId === room.createdBy;

                return (
                  <div
                    key={room.id}
                    onClick={() => handleJoinRoom(room)}
                    className={`group relative flex flex-col overflow-hidden rounded-lg md:rounded-xl border bg-white cursor-pointer transition-all hover:shadow-md ${
                      isSelected
                        ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-md"
                        : "border-slate-200 hover:border-indigo-300"
                    }`}
                  >
                    {/* 房間圖片區 */}
                    <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                      <img
                        src={
                          room.imageUrl ||
                          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60"
                        }
                        alt={room.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {room.type === "PRIVATE_GROUP" && (
                        <span className="absolute top-1 left-1 md:top-2 md:left-2 rounded bg-black/60 backdrop-blur-md px-1 py-0.5 text-[9px] md:text-[10px] text-white">
                          🔒
                        </span>
                      )}
                      <span className="absolute bottom-1 right-1 md:bottom-2 md:right-2 rounded bg-white/90 backdrop-blur-md px-1.5 py-0.5 text-[9px] md:text-[10px] font-semibold text-slate-700 shadow-sm">
                        🟢 {room._count?.members || 0} 人
                      </span>
                    </div>

                    {/* 卡片內容：手機版純保留名字，隱藏提示標籤 */}
                    <div className="flex flex-1 items-center justify-between p-2 md:p-3">
                      <h3 className="font-bold text-xs md:text-sm text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {room.name}
                      </h3>

                      {isOwner && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteRoom(room.id, e)}
                          className="rounded px-1 text-[10px] md:text-xs font-medium text-red-500 hover:bg-red-50 shrink-0 ml-1"
                        >
                          刪除
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 👉 右側：控制面板 & 聊天視窗（佔 42% 寬度） */}
        <div className="flex flex-1 flex-col gap-2 md:gap-4 shrink-0">
          
          {/* 右上方：建立新房間 */}
          <div className="rounded-xl md:rounded-2xl border border-slate-200 bg-white p-2.5 md:p-4 shadow-sm shrink-0">
            <h3 className="mb-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400">
              ➕ 建立房間
            </h3>
            <form onSubmit={handleCreateRoom} className="space-y-2">
              <input
                type="text"
                placeholder="名稱..."
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />

              <div className="flex items-center justify-between text-[11px] md:text-xs text-slate-600">
                <div className="flex gap-2">
                  <label className="flex items-center gap-0.5 cursor-pointer">
                    <input
                      type="radio"
                      value="PUBLIC_GROUP"
                      checked={newRoomType === "PUBLIC_GROUP"}
                      onChange={() => setNewRoomType("PUBLIC_GROUP")}
                      className="accent-indigo-600"
                    />
                    公開
                  </label>
                  <label className="flex items-center gap-0.5 cursor-pointer">
                    <input
                      type="radio"
                      value="PRIVATE_GROUP"
                      checked={newRoomType === "PRIVATE_GROUP"}
                      onChange={() => setNewRoomType("PRIVATE_GROUP")}
                      className="accent-indigo-600"
                    />
                    私密🔒
                  </label>
                </div>

                <button
                  type="submit"
                  className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
                >
                  建立
                </button>
              </div>

              {newRoomType === "PRIVATE_GROUP" && (
                <input
                  type="password"
                  placeholder="密碼..."
                  value={newRoomPassword}
                  onChange={(e) => setNewRoomPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              )}
            </form>
          </div>

          {/* 右下方：聊天視窗 */}
          <div className="flex flex-1 flex-col overflow-hidden rounded-xl md:rounded-2xl border border-slate-200 bg-white shadow-sm min-h-0">
            {currentRoom ? (
              <>
                {/* 頂欄 */}
                <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 md:px-4 md:py-3 bg-slate-50/50">
                  <div className="truncate pr-1">
                    <h3 className="font-bold text-xs md:text-sm text-slate-800 truncate">
                      {currentRoom.name} {currentRoom.type === "PRIVATE_GROUP" && "🔒"}
                    </h3>
                    <p className="text-[10px] md:text-[11px] text-slate-400">
                      線上：{currentRoom._count?.members || 0} 人
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLeaveRoom}
                    className="shrink-0 rounded-md border border-slate-200 px-2 py-0.5 text-[11px] md:text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    離開 🚪
                  </button>
                </div>

                {/* 訊息顯示區 */}
                <div className="flex-1 overflow-y-auto p-2.5 md:p-4 space-y-2.5 bg-slate-50/30">
                  {messages.map((msg, index) => {
                    const isMe = msg.senderId === currentUserId;

                    return (
                      <div
                        key={msg.id || index}
                        className={`flex flex-col ${
                          isMe ? "items-end" : "items-start"
                        }`}
                      >
                        {!isMe && (
                          <span className="mb-0.5 text-[10px] text-slate-400 pl-1">
                            {msg.sender?.account || `User ${msg.senderId}`}
                          </span>
                        )}

                        <div
                          className={`w-fit max-w-[90%] md:max-w-[85%] rounded-xl md:rounded-2xl px-3 py-1.5 text-xs leading-relaxed shadow-sm break-words ${
                            isMe
                              ? "bg-indigo-600 text-white rounded-br-none"
                              : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* 輸入框 */}
                <div className="border-t border-slate-100 p-2 md:p-3 bg-white">
                  <form
                    onSubmit={handleSendMessage}
                    className="flex items-center gap-1.5"
                  >
                    <input
                      type="text"
                      placeholder="輸入訊息..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors shrink-0"
                    >
                      發送
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-slate-300 p-4 text-center">
                <span className="text-2xl md:text-3xl mb-1">💬</span>
                <p className="text-[11px] md:text-xs">點擊左側房間卡片進入</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 私密房密碼彈窗 Modal */}
      {passwordModalRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h4 className="text-sm font-bold text-slate-800">
              輸入密碼進入【{passwordModalRoom.name}】
            </h4>
            <p className="mt-1 text-xs text-slate-400">
              此聊天室受密碼保護，請輸入密碼以驗證。
            </p>

            <form onSubmit={handleSubmitPassword} className="mt-4 space-y-3">
              <input
                type="password"
                placeholder="請輸入房間密碼"
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordModalRoom(null);
                    setInputPassword("");
                  }}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                >
                  進入房間
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Container>
  );
}