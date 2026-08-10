"use client";

import { type CSSProperties } from "react";
import { useReducedMotion } from "./useReducedMotion";

/* ============================================================
   吃 Aseprite 匯出的 PNG sprite sheet。

   這是 PixelSprite.tsx 的 drop-in 替換：props 完全一樣
   （mood / streak / size），所以 PetStage.tsx 只要改一行 import。

   ---- 你要準備的檔案（放 /public/pixel/）----

   chick.png    動作表。橫軸 = 動畫格，縱軸 = 狀態。
   bow.png      配件。跟 chick.png 同樣的格子尺寸與格數。
   scarf.png
   cap.png
   crown.png

   ---- 格子規格 ----

   一格 64×64（想改就改下面的 CELL）
   橫向 4 格 = 4 個動畫 frame
   縱向 5 列 = idle / happy / hungry / junk / dead（順序照 ROW）

   → chick.png 最後是 256×320 的 PNG。

   動作少於 4 格就把最後一格複製滿；每一列都必須有 4 格，
   不然 background-position 會對不準。

   配件表也要 4 格 × 5 列，跟身體同步播。配件不動的那些格
   直接複製貼上就好 —— 重點是「格數一致」，動畫才會鎖在一起。
   ============================================================ */

export type PetMood =
  | "idle"
  | "happy"
  | "hungry"
  | "junk"
  | "dead"
  | "held" // 被滑鼠拎起來（只有健康時）
  | "surprised"; // 幽靈被拎起來的驚訝 OWO

const CELL = 64; // 一格幾個像素（你的畫布尺寸）
const FRAMES = 4; // 每個狀態幾格動畫

// ★ 這裡的順序必須跟 build-sprites.mjs 的 STATES 完全一致，
//   不然拖曳觸發 held、畫面卻顯示別的狀態。
const ROW: Record<PetMood, number> = {
  idle: 0,
  happy: 1,
  hungry: 2,
  junk: 3,
  dead: 4,
  held: 5,
  surprised: 6,
};
const ROWS = 7;

// 每個狀態的播放速度（一輪幾秒）。慢 = 沉重，快 = 興奮。
// 注意：4 格跑完 = 一個 DURATION。
// 呼吸只有 2 格、被循環補成 0,1,0,1，所以一個 DURATION 會呼吸「兩次」。
// 想要一次呼吸約 1 秒 → DURATION 設 2.0。
const DURATION: Record<PetMood, number> = {
  idle: 2.0, // 兩次呼吸 → 每次 1 秒
  happy: 0.5,
  hungry: 1.6,
  junk: 3.2, // 吃土：動得又慢又小
  dead: 3.6,
  held: 0.6, // 被拎著搖晃，快一點才有掙扎感
  surprised: 0.7,
};

const BASE = "/pixel";

/* ---------- 單一圖層（身體 or 一件配件） ---------- */

function SheetLayer({
  src,
  mood,
  scale,
  reduce,
  z,
}: {
  src: string;
  mood: PetMood;
  scale: number;
  reduce: boolean;
  z: number;
}) {
  const px = CELL * scale;

  const style: CSSProperties = {
    // span 預設是 display:inline，而 inline 元素會「忽略 width / height」。
    // 少了這一行，這個圖層的尺寸是 0×0，背景圖什麼都不會顯示 —— 小雞會消失。
    display: "block",
    position: z === 0 ? "relative" : "absolute",
    inset: z === 0 ? undefined : 0,
    zIndex: z,
    width: px,
    height: px,
    backgroundImage: `url(${src})`,
    backgroundRepeat: "no-repeat",
    // 整張表放大同樣的倍率
    backgroundSize: `${FRAMES * px}px ${ROWS * px}px`,
    // 縱軸選狀態，橫軸交給 keyframe 跑
    backgroundPositionY: `${-ROW[mood] * px}px`,
    backgroundPositionX: "0px",
    // 這行是命脈：沒有它，瀏覽器會把你的像素糊成一團
    imageRendering: "pixelated",
    // keyframe 會跑到這個位置
    ["--sprite-end" as string]: `${-FRAMES * px}px`,
    animation: reduce
      ? "none"
      : `sprite-run ${DURATION[mood]}s steps(${FRAMES}) infinite`,
  };

  return <span style={style} aria-hidden />;
}

/* ---------- 對外 ---------- */

export default function PetSprite({
  mood,
  streak = 0,
  equippedHead = null,
  equippedNeck = null,
  size = 128,
  className = "",
}: {
  mood: PetMood;
  streak?: number;
  equippedHead?: "bow" | "cap" | "crown" | null;
  equippedNeck?: "scarf" | null;
  size?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  // 放大倍率一定要取整數。3.7 倍會讓像素邊緣糊掉、出現半透明的鬼影。
  const scale = Math.max(1, Math.round(size / CELL));

  // 配件戴「使用者選的」，不是「最高階的」。
  // 但要雙重把關：即使 equipped 有值，也要真的解鎖了才戴
  //   （避免 streak 掉了、卻還戴著沒資格的配件）。
  const UNLOCK = { bow: 3, cap: 14, crown: 30, scarf: 7 } as const;
  const headwear =
    equippedHead && streak >= UNLOCK[equippedHead] ? equippedHead : null;
  const scarf = equippedNeck === "scarf" && streak >= UNLOCK.scarf;

  // 這三個狀態不戴配件：
  //   dead      幽靈不穿衣服
  //   held      被拎起來，帽子王冠會掉
  //   surprised 幽靈驚訝
  // （配件的 sheet 本來就把這三列留空了，這裡是雙保險，也讓意圖明確。）
  const wearable = mood !== "dead" && mood !== "held" && mood !== "surprised";

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: CELL * scale,
        height: CELL * scale,
        lineHeight: 0,
      }}
      role="img"
      aria-label={
        mood === "dead"
          ? "小雞變成幽靈了"
          : mood === "surprised"
            ? "幽靈被拎起來嚇了一跳"
            : mood === "held"
              ? "小雞被拎起來了"
              : mood === "junk"
                ? "小雞正在吃土"
                : mood === "hungry"
                  ? "小雞餓了"
                  : "小雞"
      }
    >
      <SheetLayer src={`${BASE}/chick.png`} mood={mood} scale={scale} reduce={reduce} z={0} />
      {wearable && scarf && (
        <SheetLayer src={`${BASE}/scarf.png`} mood={mood} scale={scale} reduce={reduce} z={1} />
      )}
      {wearable && headwear && (
        <SheetLayer
          src={`${BASE}/${headwear}.png`}
          mood={mood}
          scale={scale}
          reduce={reduce}
          z={2}
        />
      )}
    </div>
  );
}