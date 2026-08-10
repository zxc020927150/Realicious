"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import CustomModal, { ModalType } from "../_components/alert"; // 引入你之前的彈窗組件

// 定義 Context 傳出的規格
interface AlertContextType {
  showAlert: (type: ModalType, title: string, message?: string, onConfirm?: () => void) => void;
  closeAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState({
    isOpen: false,
    type: "loading" as ModalType,
    title: "",
    message: "",
    onConfirm: undefined as (() => void) | undefined,
  });

  // 使用 useCallback 確保函式不會在重新渲染時被重複建立
  const showAlert = useCallback((type: ModalType, title: string, message = "", onConfirm?: () => void) => {
    setModal({ isOpen: true, type, title, message, onConfirm });
  }, []);

  const closeAlert = useCallback(() => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, closeAlert }}>
      {children}
      
      {/* 核心：整個專案唯一的彈窗組件，掛載在這裡 */}
      <CustomModal
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={closeAlert}
        onConfirm={modal.onConfirm}
      />
    </AlertContext.Provider>
  );
}

// 封裝成自訂 Hook，方便其他頁面引入
export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert 必須在 AlertProvider 內部使用");
  }
  return context;
}