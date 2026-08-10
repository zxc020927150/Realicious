"use client";

import { useEffect, useState, type ReactNode } from "react";

/* ============================================================
   16×16 點陣圖。一個字元 = 一個像素。

   k = 純黑描邊      y = 主體（主黃）
   o = 陰影／翅膀    r = 喙與腳（主紅）
   w = 白（幽靈身體 / 王冠寶石）
   . = 透明

   全部 sprite 共用同一個 16×16 座標系 → 配件可以直接疊上去。
   要改造型就直接改字串，不用碰任何 render 邏輯。
   ============================================================ */

export type PetMood = "idle" | "happy" | "hungry" | "junk" | "dead";

const CHICK = [
  "................",
  "................",
  ".......ky.......", // 一根呆毛，故意不對稱 —— 對稱的角色沒有個性
  "....kkkkkkkk....",
  "...kyyyyyyyyk...",
  "..kyyyyyyyyyyk..",
  "..kyykyyyykyyk..", // 眼睛
  "..kyyyyrryyyyk..", // 喙
  "..kyyooyyyyyyk..", // 翅膀
  "..kyyooyyyyyyk..",
  "...kyyyyyyyyk...",
  "....kkkkkkkk....",
  ".....rr..rr.....",
  "....rrr..rrr....", // 腳
  "................",
  "................",
];

// 眨眼：眼睛那一列直接抽掉 → 120ms 的閉眼
const CHICK_BLINK = CHICK.map((row, i) =>
  i === 6 ? "..kyyyyyyyyyyk.." : row,
);

// 開心：喙張開（喙從 1 列變 2 列）
const CHICK_HAPPY = CHICK.map((row, i) =>
  i === 8 ? "..kyyoorryyyyk.." : row,
);

const GHOST = [
  "................",
  "................",
  ".....kkkkkk.....",
  "....kwwwwwwk....",
  "...kwwwwwwwwk...",
  "..kwwwwwwwwwwk..",
  "..kwwkwwwwkwwk..", // 空洞的眼
  "..kwwwwwwwwwwk..",
  "..kwwwwkkwwwwk..", // 嘴
  "..kwwwwwwwwwwk..",
  "..kwwwwwwwwwwk..",
  "..kwwwwwwwwwwk..",
  "..kwwkwwkwwkwk..", // 波浪下擺
  "..kk.kk.kk.kk...",
  "................",
  "................",
];

/* ---------- 配件：跟小雞同一個 16×16 座標系，直接疊上去 ---------- */

const BOW = [
  "................",
  "................",
  "..........r.r...",
  "..........rkr...",
  "..........r.r...",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
];

const SCARF = [
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "..krrrrrrrrrrk..",
  "...rrk..........",
  "...rrk..........",
  "................",
  "................",
  "................",
  "................",
];

const CAP = [
  "................",
  ".....kkkkkk.....",
  "....krrrrrrk....",
  "...kkkkkkkkkk...",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
];

const CROWN = [
  "................",
  "....k.k.k.k.....",
  "....kwkwkwk.....",
  "....kkkkkkk.....",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
];

/* ---------- 調色盤：同一張圖，換色就換心情（NES 的老招） ---------- */

type Palette = Record<string, string>;

const PALETTES: Record<"normal" | "junk" | "dead", Palette> = {
  normal: { k: "#000000", y: "#FFD45C", o: "#E0A92E", r: "#BB0015", w: "#FFFFFF" },
  junk: { k: "#000000", y: "#B7A468", o: "#7C6134", r: "#7A2A2A", w: "#E3E3E3" }, // 灰撲撲、髒掉的黃
  dead: { k: "#000000", y: "#E3E3E3", o: "#C9C9C9", r: "#B9B9B9", w: "#E3E3E3" },
};

function paletteFor(mood: PetMood): Palette {
  if (mood === "dead") return PALETTES.dead;
  if (mood === "junk") return PALETTES.junk;
  return PALETTES.normal;
}

/* ---------- 單層 sprite ---------- */

function Layer({ grid, palette }: { grid: string[]; palette: Palette }) {
  const rects: ReactNode[] = [];
  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      if (c === ".") {
        x++;
        continue;
      }
      // 橫向合併同色像素，少掉一半以上的 DOM 節點
      let run = 1;
      while (x + run < row.length && row[x + run] === c) run++;
      rects.push(
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width={run}
          height={1}
          fill={palette[c] ?? "#000"}
        />,
      );
      x += run;
    }
  });
  return <>{rects}</>;
}

/* ---------- 對外：小雞本人 ---------- */

export default function PetSprite({
  mood,
  streak = 0,
  size = 128,
  className = "",
}: {
  mood: PetMood;
  streak?: number;
  size?: number;
  className?: string;
}) {
  const [blinking, setBlinking] = useState(false);

  // 隨機眨眼。有機的不規律 > 固定週期，這是「活著」跟「跑動畫」的差別
  useEffect(() => {
    if (mood === "dead") return;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        setBlinking(true);
        setTimeout(() => setBlinking(false), 120);
        loop();
      }, 2200 + Math.random() * 3800);
    };
    loop();
    return () => clearTimeout(t);
  }, [mood]);

  const palette = paletteFor(mood);

  let base: string[];
  if (mood === "dead") base = GHOST;
  else if (mood === "happy") base = CHICK_HAPPY;
  else if (blinking) base = CHICK_BLINK;
  else base = CHICK;

  // 配件：頭上的只戴最高階的，圍巾獨立
  const headwear =
    streak >= 30 ? CROWN : streak >= 14 ? CAP : streak >= 3 ? BOW : null;
  const scarf = streak >= 7 ? SCARF : null;

  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={className}
      style={{ imageRendering: "pixelated", display: "block" }}
      role="img"
      aria-label={
        mood === "dead"
          ? "小雞變成幽靈了"
          : mood === "junk"
            ? "小雞正在吃土"
            : mood === "hungry"
              ? "小雞餓了"
              : "小雞"
      }
    >
      <Layer grid={base} palette={palette} />
      {mood !== "dead" && scarf && <Layer grid={scarf} palette={palette} />}
      {mood !== "dead" && headwear && <Layer grid={headwear} palette={palette} />}
    </svg>
  );
}

export { CHICK, GHOST, PALETTES };
