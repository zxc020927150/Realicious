import { useState } from "react";
import Image from "next/image";
import { useAlert } from "@/app/user/context/alert";

// 預設風格封面庫（直接填寫 public 裡面的相對字串路徑）
const DEFAULT_ROOM_COVERS = [
  {
    id: "1",
    label: "蘋果",
    url: "/user/chatroom/apple.png",
  },
  {
    id: "2",
    label: "香蕉",
    url: "/user/chatroom/banana.png",
  },
  {
    id: "3",
    label: "葡萄",
    url: "/user/chatroom/grape.png",
  },
  {
    id: "4",
    label: "鳳梨",
    url: "/user/chatroom/pineapple.png",
  },
  {
    id: "5",
    label: "草莓",
    url: "/user/chatroom/strawberry.png",
  },
  {
    id: "6",
    label: "西瓜",
    url: "/user/chatroom/watermelon.jpg",
  },
];

interface CreateRoomModalProps {
  onCreateRoom: (
    name: string,
    type: "PUBLIC_GROUP" | "PRIVATE_GROUP",
    imageUrl?: string,
    password?: string,
  ) => Promise<{ success: boolean; message?: string }>;
}

export default function CreateRoomModal({
  onCreateRoom,
}: CreateRoomModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomType, setNewRoomType] = useState<
    "PUBLIC_GROUP" | "PRIVATE_GROUP"
  >("PUBLIC_GROUP");
  const [newRoomPassword, setNewRoomPassword] = useState("");
  const [selectedImage, setSelectedImage] = useState(
    DEFAULT_ROOM_COVERS[0].url,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showAlert } = useAlert();

  // 關閉 Modal 並重置所有狀態
  const handleClose = () => {
    setIsOpen(false);
    setNewRoomName("");
    setNewRoomPassword("");
    setNewRoomType("PUBLIC_GROUP");
    setSelectedImage(DEFAULT_ROOM_COVERS[0].url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return showAlert("error","請輸入房間名稱");

    if (newRoomType === "PRIVATE_GROUP" && !newRoomPassword.trim()) {
      showAlert('error',"建立私密房間時請設定密碼");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onCreateRoom(
        newRoomName,
        newRoomType,
        selectedImage, // 這裡會傳送 "/user/chatroom/apple.png" 字串給後端存 DB
        newRoomPassword,
      );

      if (result.success) {
        handleClose(); // 成功後自動關閉彈窗
      } else {
        showAlert("error","建立房間失敗");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* 觸發彈窗的創建按鈕 */}
      <button
        onClick={() => setIsOpen(true)}
        // className="flex items-center gap-1.5 bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
        className="w-20 h-8 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-white bg-[#F02A2D] hover:bg-[#e50004] cursor-pointer hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5 hover:translate-x-0 hover:translate-y-0"
      >
        <span>➕</span> 建立房間
      </button>

      {/* Modal 彈出視窗 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md border-3 bg-white p-5 shadow-2xl transition-all">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <span>➕</span> 建立新聊天房間
              </h3>
              <button
                onClick={handleClose}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* 房間名稱 */}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  房間名稱
                </label>
                <input
                  type="text"
                  placeholder="請輸入房間名稱..."
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* 選擇房間類型 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  房間類型
                </label>
                <div className="flex gap-4 text-xs text-slate-700">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      value="PUBLIC_GROUP"
                      checked={newRoomType === "PUBLIC_GROUP"}
                      onChange={() => setNewRoomType("PUBLIC_GROUP")}
                      className="accent-indigo-600"
                    />
                    公開房間
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      value="PRIVATE_GROUP"
                      checked={newRoomType === "PRIVATE_GROUP"}
                      onChange={() => setNewRoomType("PRIVATE_GROUP")}
                      className="accent-indigo-600"
                    />
                    私密房間 🔒
                  </label>
                </div>
              </div>

              {/* 私密房間密碼欄位 */}
              {newRoomType === "PRIVATE_GROUP" && (
                <div className="animate-fade-in">
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    房間密碼
                  </label>
                  <input
                    type="password"
                    placeholder="請輸入房間密碼..."
                    value={newRoomPassword}
                    onChange={(e) => setNewRoomPassword(e.target.value)}
                    className="w-full border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* 選擇風格封面 */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  選擇風格封面
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DEFAULT_ROOM_COVERS.map((cover) => (
                    <button
                      key={cover.id}
                      type="button"
                      onClick={() => setSelectedImage(cover.url)}
                      className={`cursor-pointer group relative aspect-video overflow-hidden rounded border-2 transition-all ${
                        selectedImage === cover.url
                          ? "border-indigo-600 ring-2 ring-indigo-500/20"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={cover.url}
                        alt={cover.label || "封面選項"}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      {cover.label && (
                        <span className="absolute inset-x-0 bottom-0  from-black/80 to-transparent py-1 text-[10px] font-medium text-white text-center">
                          {/* {cover.label} */}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer 按鈕 */}
              <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-20 h-8 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-white bg-gray-400 hover:bg-[#9e9d9d] cursor-pointer hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5 hover:translate-x-0 hover:translate-y-0"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className=  "w-20 h-8 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-white bg-[#F02A2D] hover:bg-[#e50004] cursor-pointer hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5 hover:translate-x-0 hover:translate-y-0"

                >
                  {isSubmitting ? "建立中..." : "確認建立"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
