import { prisma } from "../lib/prisma.js";
import bcrypt from "bcrypt";
import { formatAvatarUrl } from "../utils/formatAvatar.js";

// 🌟 取得 Socket.io 記憶體中的【真實線上人數】並廣播
function broadcastRoomMemberCount(io, roomId) {
  const numericRoomId = Number(roomId);
  const stringRoomId = String(numericRoomId);

  // 直接問 Socket.io 這個頻道現在有幾支 Socket 連線
  const onlineCount = io.sockets.adapter.rooms.get(stringRoomId)?.size || 0;

  io.emit("room_member_updated", {
    roomId: numericRoomId,
    memberCount: onlineCount, // 傳送真實線上人數
  });
}
// 🌟 共用的離房處理函式 (主動離開與斷線時皆可使用)

async function handleLeaveRoom(io, socket, roomId) {
  if (!roomId) return;

  const stringRoomId = String(roomId);

  // 1. Socket 退群
  socket.leave(stringRoomId);

  // 2. 廣播最新線上人數 (-1 後的數字)
  broadcastRoomMemberCount(io, roomId);

  // 3. 清除當前房間標記
  if (socket.currentRoomId === Number(roomId)) {
    socket.currentRoomId = null;
  }
}

export const registerChatHandlers = (io, socket) => {
  const currentUserId = socket.user.id; // 從驗證過的 socket 物件中直接取得

  // A. 監聽加入房間

  socket.on("join_room", async (payload) => {
    const roomId = typeof payload === "object" ? payload.roomId : payload;
    const password = typeof payload === "object" ? payload.password : null;
    const numericRoomId = Number(roomId);
    const stringRoomId = String(numericRoomId);

    try {
      // 如果原本在別的房間，先執行退群廣播
      if (socket.currentRoomId && socket.currentRoomId !== numericRoomId) {
        await handleLeaveRoom(io, socket, socket.currentRoomId);
      }

      const targetRoom = await prisma.chatRoom.findUnique({
        where: { id: numericRoomId },
      });

      if (!targetRoom) {
        return socket.emit("error_message", { message: "找不到該房間" });
      }

      // 1. 查詢該會員是否擁有「通行證」
      const existingMember = await prisma.roomMember.findUnique({
        where: {
          roomId_userId: { roomId: numericRoomId, userId: currentUserId },
        },
      });

      // 2. 私密房密碼驗證
      if (targetRoom.type === "PRIVATE_GROUP" && targetRoom.passwordHash) {
        const isOwner = targetRoom.createdBy === currentUserId;
        const isAlreadyMember = !!existingMember;

        // 🌟 只要是建立者或是擁有通行證的舊成員，直接放行！不用再打密碼！
        if (!isOwner && !isAlreadyMember) {
          if (!password) {
            return socket.emit("password_required", { roomId: numericRoomId });
          }

          const isMatch = await bcrypt.compare(
            password,
            targetRoom.passwordHash,
          );
          if (!isMatch) {
            return socket.emit("error_message", {
              message: "房間密碼不正確！",
            });
          }
        }
      }

      // 3. 驗證通過：加入 Socket 頻道
      socket.join(stringRoomId);
      socket.currentRoomId = numericRoomId;

      
      // 4. 頒發/更新通行證 (寫入 DB，離房也不會刪除)
      const userRole =
        targetRoom.createdBy === currentUserId ? "OWNER" : "MEMBER";
      await prisma.roomMember.upsert({
        where: {
          roomId_userId: { roomId: numericRoomId, userId: currentUserId },
        },
        update: {},
        create: {
          roomId: numericRoomId,
          userId: currentUserId,
          role: userRole,
        },
      });

      // 5. 🌟 廣播最新線上人數 (Sockets 連線數)
      broadcastRoomMemberCount(io, numericRoomId);


      // 6. 回傳歷史訊息與成功狀態
      const rawHistoryMessages = await prisma.chatMessage.findMany({
        where: { roomId: numericRoomId },
        take: 50,
        orderBy: { createdAt: "asc" },
        include: {
          sender: {
            select: {
              id: true,
              account: true,
              user_profile: {
                select: {
                  nick_name: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      // 🌟 核心處理：將所有歷史訊息的大頭貼網址批次轉為正確格式
      const historyMessages = rawHistoryMessages.map((msg) => {
        const rawAvatar = msg.sender?.user_profile?.avatar;
        const finalAvatarUrl = formatAvatarUrl(rawAvatar);

        return {
          ...msg,
          sender: {
            ...msg.sender,
            user_profile: {
              ...msg.sender?.user_profile,
              avatar: finalAvatarUrl,
            },
          },
        };
      });

      socket.emit("join_success", { room: targetRoom });
      socket.emit("load_history", historyMessages);
    } catch (error) {
      console.error("加入房間失敗:", error);
      socket.emit("error_message", { message: "無法加入房間" });
    }
  });
  // B. 監聽發送訊息
  socket.on("send_message", async (data) => {
    const { roomId, content } = data;
    try {
      const savedMessage = await prisma.chatMessage.create({
        data: {
          roomId: Number(roomId),
          senderId: Number(currentUserId),
          content: content,
        },
        include: {
          sender: {
            select: {
              id: true,
              account: true,
              user_profile: {
                select: {
                  nick_name: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });
      // 🌟 將原生的 avatar 拿出來經過格式化處裡
      const rawAvatar = savedMessage.sender?.user_profile?.avatar;
      const finalAvatarUrl = formatAvatarUrl(rawAvatar);

      // 🌟 組合最終要廣播出去的 Payload
      const messageToBroadcast = {
        ...savedMessage,
        sender: {
          ...savedMessage.sender,
          user_profile: {
            ...savedMessage.sender?.user_profile,
            avatar: finalAvatarUrl, // 將轉換後的完整網址覆蓋回去
          },
        },
      };

      // 廣播給該房間內的所有人
      io.to(String(roomId)).emit("receive_message", messageToBroadcast);
    } catch (error) {
      console.error("訊息儲存失敗:", error);
      socket.emit("error_message", { message: "訊息發送失敗" });
    }
  });

  // C. 監聽「主動離開房間」事件
  socket.on("leave_room", async ({ roomId }) => {
    await handleLeaveRoom(io, socket, roomId);
  });

  // D. 監聽「中斷連線 (關閉分頁/刷新/網路斷線)」事件
  socket.on("disconnect", async () => {
    // console.log(`使用者斷開連線: Socket ID ${socket.id}`);

    // 如果使用者斷線前在某個房間內，自動執行離房清理
    if (socket.currentRoomId) {
      await handleLeaveRoom(io, socket, socket.currentRoomId);
    }
  });
};
