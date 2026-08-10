"use client";

import { useEffect, useState } from "react";

/* ============================================================
   走路雞：把 4 張走路影格輪流換上去，看起來就在原地踏步。

   為什麼用 React 輪播 src、而不是 CSS sprite？
     因為你的 4 張是「獨立的 PNG 檔」（不是拼成一張的 sprite sheet）。
     獨立檔最單純的動法就是：每隔一小段時間換下一張 src。

   ‧ size：顯示大小（原圖 64×64，放大到 96 或 128 更好看，像素會保持硬邊）
   ‧ interval：每張停留幾毫秒（越小走越快）。150ms ≈ 順順的走路速度。
   ============================================================ */

const FRAMES = [
  "/pixel/chicken_walk1.png",
  "/pixel/chicken_walk2.png",
  "/pixel/chicken_walk3.png",
  "/pixel/chicken_walk4.png",
];

export default function WalkingChick({
  size = 96,
  interval = 150,
}: {
  size?: number;
  interval?: number;
}) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % FRAMES.length); // 0→1→2→3→0→…循環
    }, interval);
    return () => clearInterval(id); // 卸載時停掉，才不會漏計時器
  }, [interval]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={FRAMES[frame]}
      alt="走路中的小雞"
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        imageRendering: "pixelated", // 放大時保持像素硬邊，不會糊掉
      }}
      draggable={false}
    />
  );
}
