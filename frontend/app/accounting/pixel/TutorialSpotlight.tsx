"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useReducedMotion } from "./useReducedMotion";
import TutorialChick from "./PixelSprite"; // 純 SVG 版小雞,不吃 PNG 資產

/* ============================================================
   新用戶教學:聚光燈

   onboarding.type === "tutorial" 時顯示。做四件事:
     1. 50% 黑幕蓋滿全頁
     2. 圓洞從「蓋住整個畫面」收攏到剛好框住 ＋ 按鈕(lock-on 進場)
     3. 收攏完成 → 冒出引導氣泡,氣泡底下站一隻會跳的小雞
     4. 右上角一顆明顯的「跳過教學」

   ---- 為什麼整層 pointer-events-none ----
   我們「要」使用者去點那顆按鈕。黑幕只是視覺,不該攔截點擊。
   整層設 none → 點擊直接穿透到底下的按鈕(跳過鈕例外,單獨開 auto)。
   使用者記了第一筆 → txs 不空 → onboarding 變 none → 這層自然消失。

   ---- 洞怎麼挖 / 怎麼收攏 ----
   SVG mask:白=顯示、黑=挖掉。半透明黑 rect 套 mask,mask 裡放一個黑圓
   → 圓的位置變透明 = 洞。進場時用 rAF 把圓的半徑從「能蓋住整個畫面的
   大半徑」緩動到「框住按鈕的小半徑」,暗場就從四周收攏到按鈕上。

   位置用 getBoundingClientRect 量(視窗座標,對得上 fixed 定位),
   resize / scroll 會重算。量到之前不畫,避免閃一下全黑。
   ============================================================ */

type Spot = { cx: number; cy: number; r: number; vw: number; vh: number };

export default function TutorialSpotlight({
  targetRef,
  title = "從這裡記下第一筆!",
  hint = "記了帳,小雞就有東西吃了 (๑>ᴗ<๑)",
  onSkip,
}: {
  targetRef: RefObject<HTMLElement | null>;
  title?: string;
  hint?: string;
  onSkip?: () => void;
}) {
  const reduce = useReducedMotion();
  const [spot, setSpot] = useState<Spot | null>(null);

  // 進場進度 0→1。0 = 洞蓋滿全畫面(幾乎全亮),1 = 收攏到按鈕。
  // 注意:這裡固定初值 0,reduce 的情況在 render 時用推導處理(見下方 p),
  // 不在 effect 裡 setState(那會觸發串聯渲染警告)。
  const [introP, setIntroP] = useState(0);
  const introStarted = useRef(false);

  useLayoutEffect(() => {
    const measure = () => {
      const el = targetRef.current;
      if (!el) return;
      const b = el.getBoundingClientRect();
      setSpot({
        cx: b.left + b.width / 2,
        cy: b.top + b.height / 2,
        // 洞半徑:蓋住按鈕再往外留一點,讓環不貼著按鈕。
        r: Math.max(b.width, b.height) / 2 + 16,
        vw: window.innerWidth,
        vh: window.innerHeight,
      });
    };

    measure();
    const raf = requestAnimationFrame(measure); // 首幀後再量一次(版面 settle)

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true); // capture:抓內層捲動

    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (ro && targetRef.current) ro.observe(targetRef.current);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      ro?.disconnect();
    };
  }, [targetRef]);

  // 收攏進場:量到位置後「只跑一次」,把 introP 從 0 緩動到 1。
  // ★ 這裡故意依賴 hasSpot(布林)而不是 spot(物件)——這是修 bug 的關鍵:
  //   measure() 會在 rAF / ResizeObserver / scroll 時重複呼叫 setSpot,
  //   每次都產生「新的 spot 物件」。若依賴 spot,這個 effect 會一直重跑,
  //   而重跑的 cleanup 會 cancelAnimationFrame 把正在播的進場動畫砍掉,
  //   introStarted 又擋住重啟 → 動畫卡在 introP≈0 → 黑幕/氣泡都不出現,
  //   只剩右上角跳過鈕。改依賴 hasSpot(只會 false→true 一次)就穩了。
  const hasSpot = spot !== null;
  useEffect(() => {
    if (reduce) return;
    if (!hasSpot || introStarted.current) return;
    introStarted.current = true;

    const dur = 700;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic:一開始快,收尾慢
      setIntroP(eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hasSpot, reduce]);

if (!spot) return null;   // ← 量不到目標位置，整個聚光燈就不畫

  const { cx, cy, r: targetR, vw, vh } = spot;

  // 起始大半徑:離按鈕最遠的那個角落 + 一點,確保一開始蓋住整個畫面。
  const startR =
    Math.max(
      Math.hypot(cx, cy),
      Math.hypot(vw - cx, cy),
      Math.hypot(cx, vh - cy),
      Math.hypot(vw - cx, vh - cy),
    ) + 40;

  // reduce 時直接視為收攏完成(1),否則用動畫進度。推導,不 setState。
  const p = reduce ? 1 : introP;
  const holeR = startR + (targetR - startR) * p; // 目前這一幀的洞半徑
  const introDone = p >= 0.999;
  const size = holeR * 2;

  // 氣泡:放在(最終的)洞正下方,水平夾在視窗內別溢出。
  const bubbleTop = cy + targetR + 18;
  const bubbleLeft = Math.max(150, Math.min(vw - 150, cx));

  return (
    <div className="fixed inset-0 z-[55] pointer-events-none" aria-hidden>
      {/* ---- 黑幕 + 圓洞(收攏中)---- */}
      <svg
        width={vw}
        height={vh}
        viewBox={`0 0 ${vw} ${vh}`}
        className="absolute inset-0"
      >
        <defs>
          <mask id="tut-hole">
            <rect x={0} y={0} width={vw} height={vh} fill="white" />
            <circle cx={cx} cy={cy} r={holeR} fill="black" />
          </mask>
        </defs>
        <rect
          x={0}
          y={0}
          width={vw}
          height={vh}
          fill="rgba(0,0,0,0.5)"
          mask="url(#tut-hole)"
        />
      </svg>


      {/* ---- 外圈:虛線瞄準環,一直慢慢轉(想拿掉就刪這段)---- */}
      <div
        className="absolute"
        style={{ left: cx, top: cy, transform: "translate(-50%,-50%)" }}
      >
        <div
          className={reduce ? undefined : "tut-spin"}
          style={{
            width: size + 22,
            height: size + 22,
            borderRadius: "50%",
            border: "3px dashed #000",
          }}
        />
      </div>

      {/* ---- 引導氣泡 + 底下會跳的小雞。收攏完才出現 ---- */}
      {introDone && (
        <div
          className="absolute flex flex-col items-center"
          style={{ top: bubbleTop, left: bubbleLeft, transform: "translateX(-50%)" }}
        >
          <div className="talk-pop relative border-2 border-black bg-white text-black px-3 py-2 text-center">
            {/* 指向按鈕的像素小箭頭 */}
            <span
              className="absolute w-[12px] h-[12px] bg-white border-t-2 border-l-2 border-black"
              style={{ top: -7, left: "50%", transform: "translateX(-50%) rotate(45deg)" }}
            />
            <span className="block text-[13px] font-black leading-snug">{title}</span>
            <span className="block mt-1 text-[11px] font-bold text-black/60 leading-snug">
              {hint}
            </span>
          </div>

          {/* 對話底下的小雞:happy 表情 + 持續跳(reduced-motion 由 fx.css 關掉) */}
          <div className={`mt-1 ${reduce ? "" : "pixel-bob"}`}>
            <TutorialChick mood="happy" streak={0} size={72} />
          </div>
        </div>
      )}

      {/* ---- 跳過教學:右上角,明顯。單獨開 pointer-events-auto 才點得到 ---- */}
      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="pointer-events-auto absolute top-4 right-4 border-[3px] border-black bg-[#FFD45C] px-4 py-2 text-[13px] font-black shadow-[0_4px_0_#000] hover:-translate-y-0.5 hover:shadow-[0_6px_0_#000] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
        >
          跳過教學 ✕
        </button>
      )}
    </div>
  );
}