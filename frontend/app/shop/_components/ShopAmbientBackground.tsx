"use client";

import AmbientBackground from "@/app/accounting/pixel/AmbientBackground";

// 商城固定使用明亮狀態；不讀取記帳金額、連續天數或小雞資料。
export default function ShopAmbientBackground() {
  return <AmbientBackground mood="normal" intensity={0.6} danger={0} />;
}
