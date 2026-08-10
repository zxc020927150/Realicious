"use client";

import { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  account: string;
  role: string;
  nick_name: string;
  avatar: string;
}

interface UserContextType {
  user: User | null |undefined;
  loading: boolean; // 🆕 增加一個 loading 狀態，避免後端驗證完前畫面閃爍
  login: (
    account: string,
    password: string,
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const UserContext = createContext<UserContextType | null>(null);
UserContext.displayName = "UserContext";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_URL = `${BASE_URL}/user/api`;

export function UserProvider({ children }: { children: React.ReactNode }) {

  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // 🆕 預設為載入中

  // 封裝一個清除本地狀態的輔助函式
  const handleLocalLogout = () => {
    Cookies.remove("token");
    Cookies.remove("user");
    localStorage.removeItem("realicious-cart"); // 跟商城相關
    // 登出時立刻切回訪客購物車，避免全站 Header 暫時顯示上一位會員的數量。
    localStorage.removeItem("realicious-cart-active-user");
    window.dispatchEvent(new Event("cart-updated"));
    setUser(null);
  };

  // 🆕 當網頁初始化、刷新時，主動去後端驗證 Token
  useEffect(() => {
    const checkAuth = async () => {
      // 1. 🌟 新增：先檢查網址列上有沒有 Google 帶過來的 token
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get("token");

        if (tokenFromUrl) {
          // 有的話，立刻寫入 Cookie
          Cookies.set("token", tokenFromUrl, { expires: 1 });

          // 清除網址列上的 ?token=xxx，保持網址美觀
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
          // router.refresh()
        }
      }

      // 2. 接著走你原本寫得非常棒的驗證邏輯
      const token = Cookies.get("token");

      // 如果連 Token Cookie 都沒有，代表根本沒登入，直接結束 loading
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // 🔄 向後端驗證當前 Token 是否有效
        const res = await fetch(`${API_URL}/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setUser(data.user);
          Cookies.set("user", JSON.stringify(data.user), { expires: 1 });
          router.refresh();
        } else {
          handleLocalLogout();
        }
      } catch (error) {
        console.error("驗證使用者狀態失敗:", error);
        handleLocalLogout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 🟢 登入
  const login = async (account: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ account, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // 驗證成功：寫入 Cookie 並更新狀態
        Cookies.set("token", data.token, { expires: 1 });
        Cookies.set("user", JSON.stringify(data.user), { expires: 1 });

        setUser(data.user);

        // router.refresh();
        return { success: true, message: "登入成功" };
      } else {
        return { success: false, message: data.message || "登入失敗" };
      }
    } catch (error) {
      console.error("登入 API 串接失敗:", error);
      return { success: false, message: "伺服器連線失敗，請稍後再試" };
    }
  };

  // 🔴 登出
  const logout = () => {
    handleLocalLogout();
    fetch(`${API_URL}/logout`, { method: "POST" }).catch(console.error); // 目前沒功能
    window.location.href = '/user/login';
    // router.push("/user/login");
    // router.refresh();
  };

  return (
    // 🆕 把 loading 一併傳下去，讓切換路由或頂層組件可以判斷是否正在驗證中
    <UserContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw Error("it must be used within UserProvider");
  }
  return context;
};
