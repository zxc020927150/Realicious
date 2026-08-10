"use client";

import React from "react";
import { FaEye,FaEyeSlash } from "react-icons/fa";

interface PasswordToggleIconProps {
  /** 目前密碼是否為顯示狀態 */
  show: boolean;
  /** 切換顯示/隱藏的觸發函式 */
  onToggle: () => void;
  /** 可選的客製化 class 名稱 */
  className?: string;
}

export default function PasswordToggleIcon({
  show,
  onToggle,
  className = "",
}: PasswordToggleIconProps) {
  return (
    <button
      type="button" // ⚠️ 必須寫 type="button"，防止觸發 form submit
      onClick={onToggle}
      className={`cursor-pointer absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 transition-colors ${className}`}
      aria-label={show ? "隱藏密碼" : "顯示密碼"}
      tabIndex={-1} // 選擇性加入：避免使用者按 Tab 鍵切換焦點時一直對到眼睛按鈕
    >
      {show ? (
        <FaEye className="w-5 h-5" />
      ) : (
        <FaEyeSlash className="w-5 h-5" />
      )}
    </button>
  );
}