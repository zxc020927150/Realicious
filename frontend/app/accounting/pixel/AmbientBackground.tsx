"use client";

import { useEffect, useRef } from "react";

/* ============================================================
   全頁背景氛圍層。

   重點不是「有動畫」，是「動畫是有意義的」：
   ‧ 狀態好、連續天數高 → 金色的錢幣往上飄，格線慢慢走
   ‧ 吃土模式        → 整片褪色，塵埃改成往下掉
   ‧ 小雞死了        → 一切變慢、變灰，紅色暗角在呼吸
   ‧ HP 低           → 邊緣泛紅

   這樣它就不是貼上去的裝飾，而是介面的一部分。
   純 canvas，一個 rAF，不吃效能；prefers-reduced-motion 只畫一張靜態圖。
   ============================================================ */

type Mood = "normal" | "junk" | "dead";

type Mote = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
  spin: number;
};

export default function AmbientBackground({
  mood = "normal",
  intensity = 0, // 0..1，建議傳 streak / 30
  danger = 0, // 0..1，建議傳 1 - hp / HP_MAX
}: {
  mood?: Mood;
  intensity?: number;
  danger?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // 用 ref 讀 props，動畫迴圈就不用因為 props 變動而重啟
const props = useRef({ mood, intensity, danger });
useEffect(() => {
  props.current = { mood, intensity, danger };
}, [mood, intensity, danger]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let motes: Mote[] = [];

    const seed = (count: number) => {
      motes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -(0.12 + Math.random() * 0.28),
        size: Math.random() < 0.25 ? 8 : 6,
        phase: Math.random() * Math.PI * 2,
        spin: 0.6 + Math.random() * 0.8,
      }));
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      seed(Math.round((w * h) / 42000) + 8);
    };

    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let t = 0;

    const draw = () => {
      const { mood: m, intensity: inten, danger: dgr } = props.current;
      const dead = m === "dead";
      const junk = m === "junk";
      const speed = dead ? 0.25 : junk ? 0.6 : 1;

      ctx.clearRect(0, 0, w, h);

      /* ---- 1. 兩層視差格線（像素座標紙）---- */
      const drift = (t * 0.12 * speed) % 24;
      const gridAlpha = dead ? 0.03 : junk ? 0.04 : 0.05;

      ctx.strokeStyle = `rgba(0,0,0,${gridAlpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = -24 + drift; x < w + 24; x += 24) {
        ctx.moveTo(Math.round(x) + 0.5, 0);
        ctx.lineTo(Math.round(x) + 0.5, h);
      }
      for (let y = -24 + drift; y < h + 24; y += 24) {
        ctx.moveTo(0, Math.round(y) + 0.5);
        ctx.lineTo(w, Math.round(y) + 0.5);
      }
      ctx.stroke();

      // 粗格線走得比較慢 → 視差
      const drift2 = (t * 0.04 * speed) % 96;
      ctx.strokeStyle = `rgba(0,0,0,${gridAlpha * 1.6})`;
      ctx.beginPath();
      for (let x = -96 + drift2; x < w + 96; x += 96) {
        ctx.moveTo(Math.round(x) + 0.5, 0);
        ctx.lineTo(Math.round(x) + 0.5, h);
      }
      for (let y = -96 + drift2; y < h + 96; y += 96) {
        ctx.moveTo(0, Math.round(y) + 0.5);
        ctx.lineTo(w, Math.round(y) + 0.5);
      }
      ctx.stroke();

      /* ---- 2. 飄浮的像素金幣 / 塵埃 ---- */
      const fill = dead ? "#D4D4D8" : junk ? "#8B6F3E" : "#FFD45C";
      const shown = Math.max(
        4,
        Math.round(motes.length * (junk || dead ? 0.55 : 0.45 + inten * 0.55)),
      );

      for (let i = 0; i < shown; i++) {
        const p = motes[i];

        // vy 生成時是負的（往上飄）。吃土 / 死亡時翻正 → 往下掉。
        const vy = junk || dead ? Math.abs(p.vy) : p.vy;
        p.y += vy * speed;
        p.x += (p.vx + Math.sin(t * 0.008 + p.phase) * 0.18) * speed;

        if (p.y < -16) p.y = h + 16;
        if (p.y > h + 16) p.y = -16;
        if (p.x < -16) p.x = w + 16;
        if (p.x > w + 16) p.x = -16;

        // 金幣翻面：用 4 段離散寬度模擬旋轉，不做平滑縮放
        const step = Math.floor(((t * 0.02 * p.spin) % 4 + 4) % 4);
        const squash = [1, 0.5, 0.15, 0.5][step];
        const wpx = Math.max(2, Math.round(p.size * squash));
        const x = Math.round(p.x - wpx / 2);
        const y = Math.round(p.y);

        ctx.globalAlpha = dead ? 0.3 : junk ? 0.4 : 0.5;
        ctx.fillStyle = "#000";
        ctx.fillRect(x - 1, y - 1, wpx + 2, p.size + 2);
        ctx.fillStyle = fill;
        ctx.fillRect(x, y, wpx, p.size);
      }
      ctx.globalAlpha = 1;

      /* ---- 3. HP 低 / 死亡：紅色暗角在呼吸 ---- */
      const heat = Math.max(dgr, dead ? 0.85 : 0);
      if (heat > 0.4) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.02);
        const g = ctx.createRadialGradient(
          w / 2,
          h / 2,
          Math.min(w, h) * 0.28,
          w / 2,
          h / 2,
          Math.max(w, h) * 0.72,
        );
        g.addColorStop(0, "rgba(187,0,21,0)");
        g.addColorStop(
          1,
          `rgba(187,0,21,${(heat - 0.4) * 0.28 * (0.6 + 0.4 * pulse)})`,
        );
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      if (!reduce) {
        t += 1;
        raf = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  /* 頁面本身就是天空。
     小雞從底部的地面站起來，身體伸進這片天空裡 ——
     所以這裡的顏色必須跟著她的心情走。

     normal / junk 刻意壓得很淡（卡片還要看得清楚）；
     dead 可以放膽做重，那是死亡畫面，本來就該讓人不安。 */
  const sky =
    mood === "dead"
      ? { top: "#3A3450", mid: "#5C5470", low: "#8B8298" }
      : mood === "junk"
        ? { top: "#D8D2C4", mid: "#E8E4DA", low: "#F4F2EC" }
        : { top: "#FFF4D6", mid: "#FFFAF0", low: "#FFFFFF" };

  return (
    <>
      {/* 天空：抖色帶。像素遊戲沒有漸層，只有棋盤格混色。 */}
      <div
        className="fixed inset-0 -z-20 pointer-events-none sky-shift"
        style={{ background: sky.low }}
        aria-hidden
      />
      <div
        className="dither fixed inset-x-0 top-0 h-[38vh] -z-20 pointer-events-none sky-shift"
        style={
          { "--dither-a": sky.top, "--dither-b": sky.mid } as React.CSSProperties
        }
        aria-hidden
      />
      <div
        className="dither dither-sparse fixed inset-x-0 top-[38vh] h-[22vh] -z-20 pointer-events-none sky-shift"
        style={
          { "--dither-a": sky.mid, "--dither-b": sky.low } as React.CSSProperties
        }
        aria-hidden
      />

      <canvas
        ref={canvasRef}
        className="fixed inset-0 -z-10 pointer-events-none"
        aria-hidden
      />
      {/* 掃描線 + 顆粒：讓純白底不再是「空的」，而是「有材質的」 */}
      <div className="fixed inset-0 -z-10 pointer-events-none crt-lines" aria-hidden />
    </>
  );
}