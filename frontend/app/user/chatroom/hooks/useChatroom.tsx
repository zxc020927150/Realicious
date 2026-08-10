import { useState, useEffect, useRef, useCallback } from "react";
import { Socket, io } from "socket.io-client";
import Cookies from "js-cookie";
import { useSearchParams, useRouter } from "next/navigation";

export interface Room {
  id: number;
  name: string;
  type: string;
  createdBy: number;
  imageUrl?: string;
  _count?: { members: number };
  isFavorited?: boolean;
}

export interface UserProfile {
  nick_name?: string | null;
  avatar?: string | null;
}

export interface Sender {
  id: number;
  account: string;
  user_profile?: UserProfile | null;
}

export interface Message {
  id?: number;
  senderId: number;
  content: string;
  sender?: Sender;
}

export function useChatroom() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [passwordModalRoom, setPasswordModalRoom] = useState<Room | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "favorites">("all");

  const socketRef = useRef<Socket | null>(null);

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_URL = `${BASE_URL}/user/api`;

  // 取得網址 Query 參數與 Router
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomIdFromUrl = searchParams.get("roomId");

  // 1. 抓取房間清單 API
  const fetchRooms = async () => {
    const token = Cookies.get("token");
    try {
      const res = await fetch(`${API_URL}/chatrooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) setRooms(result.data);
    } catch (err) {
      console.error("獲取房間清單失敗:", err);
    }
  };

  // 2. 初始化 Socket 連線與綁定事件（僅執行一次）
  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) return;

    socketRef.current = io(`${BASE_URL}`, { auth: { token } });
    const socket = socketRef.current;

    socket.on("receive_message", (newMessage: Message) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    socket.on("load_history", (historyMessages: Message[]) => {
      setMessages(historyMessages);
    });

    socket.on("room_created", (newRoom: Room) => {
      setRooms((prev) => [newRoom, ...prev]);
    });

    socket.on("room_member_updated", ({ roomId, memberCount }: { roomId: number; memberCount: number }) => {
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, _count: { members: memberCount } } : r))
      );
      const targetRoomId = Number(roomId);
      setCurrentRoom((prevRoom) => {
        if (prevRoom && Number(prevRoom.id) === targetRoomId) {
          return {
            ...prevRoom,
            _count: {
              ...prevRoom._count,
              members: memberCount,
            },
          };
        }
        return prevRoom;
      });
    });

    socket.on("join_success", ({ room }: { room: Room }) => {
      setCurrentRoom({ ...room });
      setPasswordModalRoom(null);
    });

    socket.on("password_required", ({ roomId }: { roomId: number }) => {
      setRooms((latest) => {
        const target = latest.find((r) => r.id === roomId);
        if (target) setPasswordModalRoom(target);
        return latest;
      });
    });

    socket.on("error_message", (data: { message: string }) => (data.message));

    socket.on("room_deleted", ({ roomId }: { roomId: number }) => {
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      setCurrentRoom((prev) => {
        if (prev?.id === roomId) {
          // router.push("/user/chatroom");
          return null;
        }
        return prev;
      });
    });

    // fetchRooms();

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(()=>{
    const fetch = async ()=>{await fetchRooms()}
    fetch()
  },[])

  // 3. 底層真正的 Socket Emit Join 動作
  const emitJoinRoom = useCallback((roomId: number, password?: string) => {
    if (!socketRef.current) return;
    if (!socketRef.current.connected) socketRef.current.connect();

    setMessages([]);
    socketRef.current.emit("join_room", { roomId, password });
  }, []);

  // 4. 監聽網址的 roomId 變化，自動呼叫 Socket 加入房間
  useEffect(() => {
    if (!roomIdFromUrl) {
      // 網址沒有 roomId，重置狀態
      if (currentRoom) {
        const set = async ()=>{await setCurrentRoom(null);await setMessages([]);}
        // setCurrentRoom(null);
        // setMessages([]);
        set()
      }
      return;
    }

    const targetId = Number(roomIdFromUrl);
    // 只有當網址上的 ID 與當前房間不同時才加入
    if (currentRoom?.id !== targetId) {
      emitJoinRoom(targetId);
    }
  }, [roomIdFromUrl, currentRoom?.id, emitJoinRoom]);

  // 5. 對外提供的 joinRoom：只負責改網址，讓上面的 Effect 統一處理連線
  const joinRoom = useCallback(
    (roomId: number, password?: string) => {
      // 如果是有密碼的直接嘗試發送；如果是普通切換，直接走 router.push
      if (password) {
        emitJoinRoom(roomId, password);
      } else {
        router.push(`/user/chatroom?roomId=${roomId}`);
      }
    },
    [router, emitJoinRoom]
  );

  const createRoom = async (
    name: string,
    type: "PUBLIC_GROUP" | "PRIVATE_GROUP",
    imageUrl?: string,
    password?: string
  ) => {
    const token = Cookies.get("token");
    const res = await fetch(`${API_URL}/chatrooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, type, imageUrl, password }),
    });
    return res.json();
  };

  const sendMessage = (content: string) => {
    if (!currentRoom || !socketRef.current) return;
    socketRef.current.emit("send_message", { roomId: currentRoom.id, content });
  };

  const leaveRoom = () => {
    if (!currentRoom || !socketRef.current) return;
    socketRef.current.emit("leave_room", { roomId: currentRoom.id });
    setCurrentRoom(null);
    setMessages([]);
    router.push("/user/chatroom");
  };

  const deleteRoom = async (roomId: number) => {
    const token = Cookies.get("token");
    const res = await fetch(`${API_URL}/chatrooms/${roomId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  };

  const toggleFavorite = async (roomId: number, e: React.MouseEvent) => {
    e.stopPropagation();

    setRooms((prevRooms) =>
      prevRooms.map((room) =>
        room.id === roomId ? { ...room, isFavorited: !room.isFavorited } : room
      )
    );

    const token = Cookies.get("token");
    try {
      const res = await fetch(
        `${API_URL}/chatrooms/${roomId}/favorite`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await res.json();
      if (!result.success) fetchRooms();
    } catch (err) {
      console.error("切換追蹤狀態失敗:", err);
      fetchRooms();
    }
  };

  const filteredRooms = rooms.filter((room) => {
    if (activeTab === "favorites") return room.isFavorited;
    return true;
  });

  return {
    rooms,
    filteredRooms,
    activeTab,
    setActiveTab,
    currentRoom,
    messages,
    passwordModalRoom,
    setPasswordModalRoom,
    createRoom,
    joinRoom,
    sendMessage,
    leaveRoom,
    deleteRoom,
    toggleFavorite,
  };
}