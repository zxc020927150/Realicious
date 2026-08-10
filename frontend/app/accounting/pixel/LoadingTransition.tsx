"use client";

import { useEffect, useState } from "react";
import WalkingChick from "./WalkingChick";

/* ============================================================
   載入轉場：一層遮罩，中間放走路雞 + 文字。
   進站 / 重整時出現，停留一下後淡出消失。

   ★ 為什麼要有 mounted 這一段？（修 hydration 閃白的關鍵）
     Next.js 會先在「伺服器」把畫面畫成 HTML，再讓瀏覽器接手（hydrate）。
     如果這個遮罩一開始就顯示，伺服器畫「有遮罩」、瀏覽器又重畫一次，
     兩邊對不上 → 報 hydration 錯、還會閃白一下。
     解法：伺服器渲染時先回傳 null（什麼都不畫），等真的進到瀏覽器
     (mounted = true) 才開始顯示轉場 → 兩邊第一幀一致，就不閃、不報錯。

   ‧ holdMs：走路雞停留多久（毫秒）
   ‧ 遮罩從 header 下方（top: 64）開始，不蓋住 header
   ============================================================ */

export default function LoadingTransition({ holdMs = 1200 }: { holdMs?: number }) {
  const [mounted, setMounted] = useState(false); // 是否已進到瀏覽器
  const [phase, setPhase] = useState<"show" | "fade" | "gone">("show");

  // 進到瀏覽器才開始（避開 SSR/hydration 不一致）
  useEffect(() => {
    // 用 rAF 把 setMounted 延到下一幀，避開「effect 裡同步 setState」的警告。
    const raf = requestAnimationFrame(() => setMounted(true));
    const t1 = setTimeout(() => setPhase("fade"), holdMs); // 時間到 → 淡出
    const t2 = setTimeout(() => setPhase("gone"), holdMs + 250); // 淡出結束 → 移除
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [holdMs]);

  // 伺服器端 / 還沒掛載 → 什麼都不畫（兩邊第一幀一致，不閃白）
  if (!mounted || phase === "gone") return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center justify-center gap-4"
      style={{
        top: 64, // header 高度；不是 64 就改這個數字
        background: "#FCF9F6",
        opacity: phase === "fade" ? 0 : 1,
        transition: "opacity 0.25s ease", // 快版淡出，不會太柔、不破像素風
        pointerEvents: phase === "fade" ? "none" : "auto",
      }}
      aria-hidden={phase === "fade"}
    >
      <WalkingChick size={112} />
      <span className="text-[13px] font-black tracking-wide text-black/70">
        載入中…
      </span>
    </div>
  );
}