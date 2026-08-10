"use client";

import { useSyncExternalStore } from "react";

/* ============================================================
   訂閱「使用者的系統偏好：減少動態效果」

   為什麼不是 useState + useEffect？

   因為 prefers-reduced-motion 是一個「外部系統」（作業系統的
   無障礙設定），不是 React 管理的狀態。

   如果寫成：
     useEffect(() => { setReduce(mq.matches) }, [])
   → 在 effect 本體裡同步呼叫 setState → 串聯渲染 → React 會警告你。

   useSyncExternalStore 是 React 18 專門為這件事做的 API：
     ‧ subscribe        —— 怎麼訂閱外部系統的變化
     ‧ getSnapshot      —— 現在的值是什麼（瀏覽器）
     ‧ getServerSnapshot —— SSR 的時候當作什麼（沒有 window）

   最後那個參數是 Next.js 的命脈：伺服器上沒有 window，
   少了它會 hydration mismatch。
   ============================================================ */

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  // 伺服器端沒有 window。先當作「允許動畫」，
  // 到瀏覽器再由 getSnapshot 修正。
  return false;
}

export function useReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}