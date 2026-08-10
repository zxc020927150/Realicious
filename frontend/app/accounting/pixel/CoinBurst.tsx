"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useReducedMotion } from "./useReducedMotion";

/* ============================================================
   「記帳 & 餵食」按下去之後的酬賞。

   從小雞身上迸出一串像素金幣，飛出去、掉下來、消失。

   ---- 為什麼這裡直接操作 DOM，而不是用 React state？----

   14 顆金幣、每顆每秒更新 60 次位置 = 每秒 840 次 setState。
   每一次都會讓整個 AccountingApp（日曆、明細、狀態卡）重新 render。
   畫面會卡死。

   而且金幣不是「狀態」—— 它們是一次性的視覺效果。沒有人要查詢它們，
   它們不影響任何邏輯，它們不是資料。

   React 真正的規則是「不要用手動 DOM 操作去改變 React 正在管理的東西」。
   這裡沒有違反：那些 span 被 append 到一個 React 不管理內容的圖層裡，
   動畫交給瀏覽器自己的動畫引擎跑，跑完自己 remove，整段關在 useEffect
   裡而且有清理。

   React 官方文件把這叫「Escape Hatches」。framer-motion、react-confetti、
   react-three-fiber 內部全都這樣做。

   ---- 兩層 span 是故意的 ----
   外層跑拋物線（平滑），內層跑翻面（steps，一格一格）。
   一個 transform 沒辦法同時做兩件事。
   ============================================================ */

export default function CoinBurst({
  fire,
  originRef,
  count = 14,
}: {
  fire: number; // 每次 +1 就噴一次
  originRef: RefObject<HTMLElement | null>;
  count?: number;
}) {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (fire === 0 || reduce) return;

    const layer = layerRef.current;
    const origin = originRef.current;
    if (!layer || !origin) return;

    const r = origin.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height * 0.55;

    const running: Animation[] = [];

    for (let i = 0; i < count; i++) {
      const outer = document.createElement("span");
      const inner = document.createElement("span");

      outer.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:10px;height:10px;margin:-5px 0 0 -5px;pointer-events:none;will-change:transform,opacity;`;
      inner.style.cssText = `display:block;width:10px;height:10px;background:#FFD45C;border:2px solid #000;box-sizing:border-box;`;
      outer.appendChild(inner);
      layer.appendChild(outer);

      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.0; // 往上為主的扇形
      const power = 70 + Math.random() * 120;
      const dx = Math.cos(angle) * power;
      const peak = Math.sin(angle) * power;
      const drop = 140 + Math.random() * 120;
      const dur = 700 + Math.random() * 400;

      const a = outer.animate(
        [
          { transform: "translate(0,0)", opacity: 1, offset: 0 },
          {
            transform: `translate(${dx * 0.6}px, ${peak}px)`,
            opacity: 1,
            offset: 0.42,
            easing: "cubic-bezier(.15,.7,.4,1)",
          },
          {
            transform: `translate(${dx}px, ${peak + drop}px)`,
            opacity: 0,
            offset: 1,
            easing: "cubic-bezier(.5,0,.9,.5)",
          },
        ],
        { duration: dur, fill: "forwards" },
      );

      // 金幣翻面：離散 4 格，不做平滑縮放
      const spin = inner.animate(
        [
          { transform: "scaleX(1)" },
          { transform: "scaleX(0.45)" },
          { transform: "scaleX(0.1)" },
          { transform: "scaleX(0.45)" },
          { transform: "scaleX(1)" },
        ],
        {
          duration: 320,
          iterations: Math.ceil(dur / 320),
          easing: "steps(1, end)",
        },
      );

      a.onfinish = () => outer.remove();
      running.push(a, spin);
    }

    // 清理：元件被卸載時，把還在飛的金幣收乾淨
    return () => {
      running.forEach((a) => a.cancel());
      layer.replaceChildren();
    };
  }, [fire, originRef, count, reduce]);

  return (
    <div
      ref={layerRef}
      className="fixed inset-0 z-[60] pointer-events-none"
      aria-hidden
    />
  );
}

/* ============================================================
   數字滾動：金額不要用「跳」的，用「數」的。

   ---- 為什麼 return 的是 `reduce ? value : display`？----

   使用者如果開了「減少動態效果」，我們就不該跑動畫。
   但「在 effect 裡同步 setDisplay(value)」會觸發串聯渲染，
   React 會警告你（就是你剛剛看到的那個錯）。

   正確做法：不要用 state 存它，直接「推導」出來。
   reduce 是 true → 直接回傳 value，state 根本不參與。

   setDisplay 只在 requestAnimationFrame 的 callback 裡呼叫 ——
   那是非同步的，不在 effect 本體裡，所以沒有串聯渲染的問題。
   ============================================================ */

export function useCountUp(value: number, duration = 450) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    if (reduce) {
      fromRef.current = value;
      return;
    }

    const from = fromRef.current;
    const delta = value - from;
    if (delta === 0) return;

    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + delta * eased)); // ← 在 rAF callback 裡，非同步
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduce]);

  return reduce ? value : display;
}