import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Room, Message } from "../hooks/useChatroom";

interface ChatWindowProps {
  currentRoom: Room | null;
  messages: Message[];
  currentUserId: number;
  onSendMessage: (content: string) => void;
  onLeaveRoom: () => void;
}

export default function ChatWindow({
  currentRoom,
  messages,
  currentUserId,
  onSendMessage,
  onLeaveRoom,
}: ChatWindowProps) {
  const [input, setInput] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef<boolean>(true);
  const prevMessagesLengthRef = useRef<number>(messages.length);
  const isFirstLoadRef = useRef<boolean>(true);

  // 滾動到底部的通用函式
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const container = chatContainerRef.current;
    if (!container) return;

    if (behavior === "instant") {
      // 瞬間跳轉：直接給值不走動畫，最乾淨
      container.scrollTop = container.scrollHeight;
    } else {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }

    setUnreadCount(0);
    isNearBottomRef.current = true;
  };

  // 監聽使用者手動滾動行為
  const handleScroll = () => {
    const container = chatContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    const isAtBottom = distanceFromBottom < 80;
    isNearBottomRef.current = isAtBottom;

    if (isAtBottom && unreadCount > 0) {
      setUnreadCount(0);
    }
  };

  // 切換房間時：重置狀態並標記為「準備第一次載入」
  useEffect(() => {
    const effect = async () => {
      await setUnreadCount(0);
    };
    effect();
    isNearBottomRef.current = true;
    prevMessagesLengthRef.current = messages.length;
    isFirstLoadRef.current = true;
  }, [currentRoom?.id]);

  // 處理訊息更新、切換房間後的第一次訊息渲染
  useLayoutEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    // 情況 A：剛進入房間或訊息第一次載入/切換完畢 -> 瞬間置底
    if (isFirstLoadRef.current) {
      if (messages.length > 0) {
        requestAnimationFrame(() => {
          scrollToBottom("instant");
          isFirstLoadRef.current = false;
        });
      }
      prevMessagesLengthRef.current = messages.length;
      return;
    }

    // 情況 B：正常對話中接收/發送新訊息
    const hasNewMessage = messages.length > prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;

    if (!hasNewMessage) return;

    const lastMessage = messages[messages.length - 1];
    const isMyMessage = lastMessage?.senderId === currentUserId;

    if (isMyMessage || isNearBottomRef.current) {
      // 我發的訊息或原本就在底部 -> 平滑滾動
      scrollToBottom("smooth");
    } else {
      // 往上翻歷史紀錄時收到別人的新訊息 -> 未讀提示 +1
      setUnreadCount((prev) => prev + 1);
    }
  }, [messages, currentUserId]);

  if (!currentRoom) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-slate-300 p-4 text-center border rounded-xl">
        <span className="text-2xl md:text-3xl mb-1">💬</span>
        <p className="text-[11px] md:text-xs">點擊左側房間卡片進入</p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
  };

  return (
    <div className="flex flex-1 flex-col h-dvh sm:h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm relative">
      {/* Header */}
      <div className="fixed w-full sm:relative z-10 flex items-center justify-between border-b px-4 py-3 bg-white shrink-0">
        <div>
          <h3 className="font-bold text-sm text-slate-800">
            {currentRoom.name}
          </h3>
        </div>
        <button
          onClick={onLeaveRoom}
          className="w-20 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-gray-200 hover:bg-gray-300 cursor-pointer hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5 hover:translate-x-0 hover:translate-y-0"
        >
          離開 🚪
        </button>
      </div>
      <div className="w-full h-14 sm:hidden"></div>

      {/* Messages 容器 */}

      <div className="flex-1 h-dvh relative min-h-0 overflow-hidden overflow-y-auto flex flex-col">
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className=" flex-1 overflow-y-auto p-4 space-y-2.5"
        >
          {messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUserId;
            const profile = msg.sender?.user_profile;
            const avatarUrl =
              profile?.avatar ||
              `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.sender?.account || idx}`;
            const displayName =
              profile?.nick_name ||
              msg.sender?.account ||
              `User #${msg.senderId}`;

            return (
              <div
                key={msg.id || idx}
                className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* 大頭貼 */}
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0"
                />

                <div
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <span className="text-[10px] text-slate-400 mb-1 px-0.5">
                    {displayName}
                  </span>

                  <div
                    className={`px-3 py-1.5 rounded-2xl max-w-[260px] sm:max-w-[360px] break-words shadow-sm ${
                      isMe
                        ? "bg-[#d1021a] text-red-50 rounded-tr-none"
                        : "bg-slate-100 text-slate-800 rounded-tl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 新訊息懸浮按鈕 */}
        {unreadCount > 0 && (
          <button
            onClick={() => scrollToBottom("smooth")}
            className="absolute bottom-3 right-4 bg-gray-100 hover:bg-gray-300 border text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 transition-all animate-bounce cursor-pointer z-10"
          >
            <span>↓ 有 {unreadCount} 則新訊息</span>
          </button>
        )}
      </div>

      {/* Input */}
      <form
        className="border-t p-2 relative flex w-full h-15 justify-center items-center bottom-0 gap-2 bg-white shrink-0"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="輸入訊息..."
          className="flex-1 w-full border rounded px-2 py-1 focus:outline-none"
        />

        <button
          type="submit"
          className="bg-[#FFD45C] hover:bg-[#fbc632] w-15 h-8 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5 hover:translate-x-0 hover:translate-y-0"
        >
          發送
        </button>
      </form>
    </div>
  );
}
