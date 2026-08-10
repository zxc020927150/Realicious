"use client";

import { useState, useRef, MouseEvent, ChangeEvent } from "react";
import AvatarEditor, { AvatarEditorRef } from "react-avatar-editor";
import Cookies from "js-cookie";
import Image, { StaticImageData } from "next/image";
import defaultAvatar from "@/public/user/Avatar.png";
import { IoMdPhotos } from "react-icons/io";
import { useAlert } from "../../context/alert";

// 🌟 預設圖片路徑 (對應 public/user/default_avatars/ 檔名)
const DEFAULT_AVATARS = [
  "/user/default_avatars/chicken_normal.png",
  "/user/default_avatars/chicken_happy.png",
  "/user/default_avatars/chicken_cry.png",
  "/user/default_avatars/chicken_woo.png",
];

interface AvatarUploaderProps {
  currentAvatar: string | null | undefined;
  onUploadSuccess: (newUrl: string) => void;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_URL = `${BASE_URL}/user/api`;
  
export default function AvatarUploader({
  currentAvatar,
  onUploadSuccess,
}: AvatarUploaderProps) {
  const editorRef = useRef<AvatarEditorRef>(null);

  // 1. 控制 Modal 開關與 Tab 狀態
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"default" | "upload">("default");

  // 2. 預設頭像狀態
  const [selectedDefault, setSelectedDefault] = useState<string>(
    DEFAULT_AVATARS[0],
  );

  // 3. 上傳與裁切狀態
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const { showAlert } = useAlert();

  // 開啟 Modal
  const handleOpenModal = () => setIsModalOpen(true);

  // 關閉 Modal 並重置輸入
  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedFile(null);
    setScale(1);
    setActiveTab("default");
    const fileInput = document.getElementById(
      "avatar-input",
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  // 背景點擊處理
  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) handleCancel();
  };

  // 選擇本地檔案
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // 送出變更 (處理預設頭像 OR 裁切上傳)
  const handleConfirmSave = async () => {
    setIsUploading(true);
    const token = Cookies.get("token");

    // 情況 A：選擇預設頭像
    if (activeTab === "default") {
      try {
        const res = await fetch(`${API_URL}/avatar`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            avatarType: "default",
            defaultUrl: selectedDefault, // 傳送如 "/user/default_avatars/chicken_normal.png"
          }),
        });

        const result = await res.json();
        if (res.ok && result.success) {
          showAlert("success", "大頭貼更新成功！");
          onUploadSuccess(result.avatar);
          handleCancel();
        } else {
          showAlert("error", "上傳失敗", result.message);
        }
      } catch (error) {
        console.error("預設頭像 API 失敗:", error);
        showAlert("error", "伺服器連線失敗", "請稍後再試");
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // 情況 B：上傳照片 (帶裁切)
    if (activeTab === "upload") {
      if (!editorRef.current || !selectedFile) {
        showAlert("error", "提示", "請先選擇要上傳的照片");
        setIsUploading(false);
        return;
      }

      const canvas = editorRef.current.getImageScaledToCanvas();
      canvas.toBlob(async (blob: Blob | null) => {
        if (!blob) {
          setIsUploading(false);
          return;
        }

        const croppedFile = new File([blob], selectedFile.name, {
          type: selectedFile.type,
        });

        const formData = new FormData();
        formData.append("avatar", croppedFile);

        try {
          const res = await fetch(`${API_URL}/avatar`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });

          const result = await res.json();
          if (res.ok && result.success) {
            showAlert("success", "大頭貼更新成功！");
            onUploadSuccess(result.avatar);
            handleCancel();
          } else {
            showAlert("error", "上傳失敗", result.message);
          }
        } catch (error) {
          console.error("上傳大頭貼 API 失敗:", error);
          showAlert("error", "伺服器連線失敗", "請稍後再試");
        } finally {
          setIsUploading(false);
        }
      }, selectedFile.type);
    }
  };

  // 🌟 修正 2：精準的比對邏輯
  let displayAvatar: string | StaticImageData = defaultAvatar;

  if (
    currentAvatar &&
    typeof currentAvatar === "string" &&
    currentAvatar.trim() !== ""
  ) {
    if (
      currentAvatar.startsWith("http://") ||
      currentAvatar.startsWith("https://")
    ) {
      // 1. 完整網址 (如 Google 第三方登入)
      displayAvatar = currentAvatar;
    } else if (
      DEFAULT_AVATARS.includes(currentAvatar) ||
      currentAvatar.startsWith("/user/default_avatars/")
    ) {
      // 2. 用戶選了前端 public/user/default_avatars/ 底下的預設小雞圖片 (直接拿相對路徑)
      displayAvatar = currentAvatar;
    } else {
      // 3. 用戶自訂上傳的照片 (放在後端 Node.js 伺服器，例如 /user/avatars/avatar-xxx.jpeg)
      const backendBase = API_URL.replace("/user/api", "");
      const cleanPath = currentAvatar.startsWith("/")
        ? currentAvatar
        : `/${currentAvatar}`;
      displayAvatar = `${backendBase}${cleanPath}`;
    }
  }

  return (
    <div className="relative w-32 h-32">
      {/* 大頭貼與點擊彈窗按鈕 */}
      <div className="relative h-32 w-32">
        <div className="h-full w-full overflow-hidden rounded-full border-2 border-gray-200 shadow-inner">
          <Image
            src={displayAvatar}
            alt="Avatar"
            className="h-full w-full rounded-full object-cover"
            width={128}
            height={128}
            priority
          />
        </div>

        {/* 觸發彈窗按鈕 */}
        <button
          type="button"
          onClick={handleOpenModal}
          className="cursor-pointer absolute bottom-0 right-0 z-10 flex -translate-x-1 translate-y-1 items-center justify-center rounded-full border border-white bg-blue-600 p-2 text-white shadow-md transition transform hover:bg-blue-700"
          title="修改大頭貼"
        >
          <IoMdPhotos size={18} />
        </button>
      </div>

      {/* 彈出視窗 Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in cursor-pointer"
          onClick={handleBackdropClick}
        >
          <div
            className="relative border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-130 flex w-full max-w-sm flex-col items-center bg-white p-6 cursor-default mx-4 animate-pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-base font-bold text-gray-800">
              修改大頭貼
            </h3>

            {/* 頁籤切換按鈕 (Tabs) */}
            <div className="mb-4 flex w-full border-b text-sm">
              <button
                type="button"
                className={`flex-1 pb-2 font-medium transition ${
                  activeTab === "default"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                onClick={() => setActiveTab("default")}
              >
                選預設圖片
              </button>
              <button
                type="button"
                className={`flex-1 pb-2 font-medium transition ${
                  activeTab === "upload"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                onClick={() => setActiveTab("upload")}
              >
                上傳自訂照片
              </button>
            </div>

            {/* === Tab 1: 選擇預設圖片 === */}
            {activeTab === "default" && (
              <div className="grid grid-cols-2 gap-3 py-4 px-4 w-full justify-items-center place-items-center">
                {DEFAULT_AVATARS.map((url, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedDefault(url)}
                    className={`relative h-30 w-30 overflow-hidden rounded-full border-2 transition ${
                      selectedDefault === url
                        ? "border-blue-600 ring-2 ring-blue-300"
                        : "border-gray-200 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={url}
                      alt={`預設大頭貼 ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* === Tab 2: 自訂圖片 (包含檔名選擇與裁切編輯器) === */}
            {activeTab === "upload" && (
              <div className="flex flex-col items-center w-full relative">
                {!selectedFile ? (
                  <div className="py-8 flex flex-col items-center">
                    <label className="cursor-pointer rounded-lg bg-blue-50 px-4 py-2 text-xs font-medium text-blue-600 hover:bg-blue-100 transition">
                      選擇電腦中的照片
                      <input
                        id="avatar-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                ) : (
                  <>
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 my-2">
                      <AvatarEditor
                        ref={editorRef}
                        image={selectedFile}
                        width={160}
                        height={160}
                        border={30}
                        borderRadius={100}
                        color={[255, 255, 255, 0.6]}
                        scale={scale}
                        rotate={0}
                      />
                    </div>

                    {/* 縮放條 */}
                    <div className="my-2 flex w-full items-center space-x-2">
                      <span className="text-xs text-gray-400">縮小</span>
                      <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.01"
                        value={scale}
                        onChange={(e) => setScale(parseFloat(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                      <span className="text-xs text-gray-400">放大</span>
                    </div>

                    {/* 重選照片 */}
                    <label className="mt-1 cursor-pointer text-xs text-blue-600 hover:underline">
                      重新選擇圖片
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  </>
                )}
              </div>
            )}

            {/* Modal 操作按鈕 */}
            <div className=" absolute right-4 bottom-4 mt-6 flex w-full justify-end space-x-3 border-t pt-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isUploading}
                // className=" bg-gray-100 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 transition"
                className="mr-4 w-20 h-10 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-white bg-gray-400 hover:bg-[#9e9d9d] cursor-pointer hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isUploading}
                // className=" bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition disabled:bg-blue-400"
                className="w-20 h-10 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-white bg-[#F02A2D] hover:bg-[#e50004] cursor-pointer hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                {isUploading ? "保存中..." : "確認變更"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
