import express from "express";
import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma.js";
import { authenticateToken } from "../../middlewares/hua/auth.js";

const router = express.Router();

// 1. 取得所有房間清單 (包含成員數與當前使用者的追蹤狀態)
router.get("/", authenticateToken, async (req, res) => {
  try {
    // 💡 從 authenticateToken 取得當前登入的使用者 ID
    const currentUserId = req.user.id; 

    const rooms = await prisma.chatRoom.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        creator: {
          select: { id: true, account: true },
        },
        _count: {
          select: { members: true },
        },
        // 💡 1. 關鍵：抓取當前登入使用者的收藏紀錄
        favorites: {
          where: {
            userId: currentUserId,
          },
          select: {
            userId: true,
          },
        },
      },
    });

    // 🌟 取得 Express 掛載的 Socket.io 實例
    const io = req.app.get("io");

    // 🌟 計算每個房間的即時線上人數 + 計算是否已追蹤
    const formattedRooms = rooms.map((room) => {
      // 拿到目前該 Socket Room 內的連線數量
      const roomSockets = io?.sockets?.adapter?.rooms.get(String(room.id));
      const onlineCount = roomSockets ? roomSockets.size : 0;

      // 💡 2. 判斷是否有收藏 (只要 favorites 陣列有資料，代表當前使用者有收藏)
      const isFavorited = room.favorites.length > 0;

      // 解構拿掉內部用的 favorites 陣列，避免把多餘資料傳給前端
      const { favorites, ...roomData } = room;

      return {
        ...roomData,
        isFavorited: isFavorited, // 💡 回傳 boolean 給前端 useChatroom 使用！
        onlineCount: onlineCount,
        _count: {
          ...room._count,
          members: onlineCount, // 讓讀 _count.members 的前端拿到即時人數
        },
      };
    });

    res.json({ success: true, data: formattedRooms });
  } catch (error) {
    console.error("取得房間失敗:", error);
    res.status(500).json({ success: false, message: "無法取得房間清單" });
  }
});

// 2. 建立新房間
router.post("/", authenticateToken, async (req, res) => {
  const { name, type, imageUrl, password } = req.body;
  const userId = req.user.id;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: "請輸入房間名稱" });
  }

  if (type === "PRIVATE_GROUP" && (!password || !password.trim())) {
    return res
      .status(400)
      .json({ success: false, message: "私密房間必須設定密碼" });
  }

  try {
    let passwordHash = null;
    if (type === "PRIVATE_GROUP" && password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const newRoom = await prisma.$transaction(async (tx) => {
      const room = await tx.chatRoom.create({
        data: {
          name: name,
          type: type || "PUBLIC_GROUP",
          imageUrl: imageUrl || null, // 🌟 若前端沒傳，直接存 null，簡單乾淨！
          passwordHash: passwordHash,
          createdBy: userId,
        },
      });

      await tx.roomMember.create({
        data: {
          roomId: room.id,
          userId: userId,
          role: "OWNER",
        },
      });
      return room;
    });

    const io = req.app.get("io");
    if (io) {
      const safeRoomData = {
        id: newRoom.id,
        name: newRoom.name,
        type: newRoom.type,
        imageUrl: newRoom.imageUrl,
        createdBy: newRoom.createdBy,
        createdAt: newRoom.createdAt,
        isProtected: !!newRoom.passwordHash,
        _count: { members: 1 },
      };
      io.emit("room_created", safeRoomData);
    }

    res.status(201).json({ success: true, data: newRoom });
  } catch (error) {
    console.error("建立房間失敗:", error);
    res.status(500).json({ success: false, message: "建立房間失敗" });
  }
});
// DELETE /user/api/chatrooms/:id
router.delete("/:id", authenticateToken, async (req, res) => {
  const roomId = Number(req.params.id);
  const userId = req.user.id;

  try {
    // 1. 查詢房間是否存在，並確認建立者身分
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return res.status(404).json({ success: false, message: "找不到該房間" });
    }

    if (room.createdBy !== userId) {
      return res
        .status(403)
        .json({ success: false, message: "只有房間建立者才能刪除此房間！" });
    }

    // 2. 執行刪除 (Prisma schema 中的 onDelete: Cascade 會一併清空關聯的訊息與成員記錄)
    await prisma.chatRoom.delete({
      where: { id: roomId },
    });

    // 3. 🌟 Socket 全域廣播「房間已被刪除」事件
    const io = req.app.get("io");
    if (io) {
      io.emit("room_deleted", { roomId });
    }

    res.status(200).json({ success: true, message: "房間已成功刪除" });
  } catch (error) {
    console.error("刪除房間失敗:", error);
    res.status(500).json({ success: false, message: "刪除房間失敗" });
  }
});

// POST /user/api/chatrooms/:id/favorite
// 追蹤功能
router.post("/:id/favorite", authenticateToken, async (req, res) => {
  const userId = Number(req.user.id);
  const roomId = Number(req.params.id);

  try {
    // 1. 查詢是否已追蹤
    const existing = await prisma.favoriteRoom.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
    });

    if (existing) {
      // 2. 已存在 -> 刪除 (取消追蹤)
      await prisma.favoriteRoom.delete({
        where: {
          userId_roomId: {
            userId,
            roomId,
          },
        },
      });

      return res.json({
        success: true,
        message: "已取消追蹤",
        isFavorited: false,
      });
    } else {
      // 3. 不存在 -> 新增 (追蹤)
      await prisma.favoriteRoom.create({
        data: {
          userId,
          roomId,
        },
      });

      return res.json({
        success: true,
        message: "追蹤成功",
        isFavorited: true,
      });
    }
  } catch (error) {
    console.error("切換追蹤失敗:", error);
    res.status(500).json({ success: false, message: "伺服器錯誤" });
  }
});


// 取得「我追蹤的」與「我建立的」聊天室清單（含即時線上人數）
router.get("/sidebar", authenticateToken, async (req, res) => {
  try {
    // 從 JWT 中間件解析出來的 user 物件拿到當前使用者 ID
    const currentUserId = req.user.id; 

    // 1. 並行查詢：追蹤的房間 + 自己建立的房間
    const [favoriteRecords, createdRooms] = await Promise.all([
      // 查 FavoriteRoom 關聯表
      prisma.favoriteRoom.findMany({
        where: { userId: currentUserId },
        orderBy: { createdAt: "desc" },
        include: {
          room: {
            include: {
              creator: {
                select: { id: true, account: true },
              },
              _count: {
                select: { members: true },
              },
              // 順便帶出最後一則訊息當作預覽 (可選)
              messages: {
                take: 1,
                orderBy: { createdAt: "desc" },
                select: { content: true, createdAt: true },
              },
            },
          },
        },
      }),

      // 查自己建立的 ChatRoom
      prisma.chatRoom.findMany({
        where: { createdBy: currentUserId },
        orderBy: { createdAt: "desc" },
        include: {
          creator: {
            select: { id: true, account: true },
          },
          _count: {
            select: { members: true },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: { content: true, createdAt: true },
          },
        },
      }),
    ]);

    // 🌟 取得 Express 掛載的 Socket.io 實例
    const io = req.app.get("io");

    // 🛠️ 封裝一個計算 Socket 線上人數的工具函式
    const attachOnlineCount = (room) => {
      const roomSockets = io?.sockets?.adapter?.rooms.get(String(room.id));
      const onlineCount = roomSockets ? roomSockets.size : 0;

      return {
        ...room,
        onlineCount,
        _count: {
          ...room._count,
          onlineMembers: onlineCount, // 建議獨立開一個欄位代表線上人數
        },
      };
    };

    // 2. 格式化追蹤的房間（把 favoriteRecord 攤平成 room 物件）並加上 onlineCount
    const favoritesWithOnline = favoriteRecords.map((fav) =>
      attachOnlineCount(fav.room)
    );

    // 3. 格式化自己建立的房間並加上 onlineCount
    const createdWithOnline = createdRooms.map((room) =>
      attachOnlineCount(room)
    );

    // 4. 回傳前端要求的標準格式
    res.json({
      success: true,
      data: {
        favorites: favoritesWithOnline,
        created: createdWithOnline,
      },
    });
  } catch (error) {
    console.error("取得側邊欄聊天室失敗:", error);
    res.status(500).json({ success: false, message: "無法取得聊天室清單" });
  }
});

router.get("/popular", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 4;

    // 💡 注意：改為 ChatRoom (大寫 R)，並使用 select 排除密碼等敏感資料
    const popularRooms = await prisma.chatRoom.findMany({
      take: limit,
      select: {
        id: true,
        name: true,
        type: true,
        imageUrl: true,
        _count: {
          select: {
            favorites: true, // 統計收藏數
            members: true,   // 統計成員數
          },
        },
      },
      orderBy: {
        favorites: {
          _count: "desc", // 依收藏數量降冪排序
        },
      },
    });

    // 格式化資料給前端 PopularChatroomsSection 使用
    const formatted = popularRooms.map((room) => ({
      id: room.id,
      name: room.name,
      type: room.type,
      imageUrl: room.imageUrl,
      favoriteCount: room._count.favorites,
      _count: {
        members: room._count.members,
      },
    }));

    return res.json({ success: true, data: formatted });
  } catch (err) {
    console.error("抓取熱門聊天室失敗:", err);
    return res.status(500).json({ success: false, message: "伺服器錯誤" });
  }
});


export default router;
