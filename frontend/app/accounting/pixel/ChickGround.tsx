"use client";

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import PetSprite, { type PetMood } from "./PixelSpriteSheet";

/* ============================================================
   地面條 —— 小雞住的地方,而且可以被拎起來 + 被戳說話

   ★ 這裡「沒有」天空。頁面本身就是天空。
   AmbientBackground 已經是滿版、會跟著心情變的舞台。這裡只有「地」。

   ---- 拖曳互動 ----

   按住小雞 → 她被拎起來,跟著滑鼠跑,放開掉回地面。
     ‧ 健康(idle/happy/hungry)被拎 → 切 held(認命的垂眼)
     ‧ 吃土(junk)           → 不給拎
     ‧ 幽靈(dead)被拎       → 切 surprised(OWO 嚇一跳)

   ---- 戳一下說話(這次新加的)----

   同一次 pointer 互動裡,我們要分辨「戳」和「拖」:
     ‧ 按下後沒怎麼移動就放開 → 戳(tap) → 呼叫 onPoke,外層播台詞
     ‧ 移動超過 TAP_SLOP     → 拖曳,不算戳(不然拖一下就狂跳台詞)

   三種狀態都能被戳:健康、吃土、幽靈。台詞內容由外層的 chickTalk 決定,
   ChickGround 只負責「偵測到戳了 → 通知外層」,不管講什麼。

   技術重點:拖曳「不用 React state 存每一幀的座標」。
   一秒 60 次 setState 會讓整個頁面重新 render,卡死。
   拖曳中直接改 DOM 的 transform(ref),只有「開始拖 / 放開」用 setState。
   ============================================================ */

const CELL = 64;
const FOOT_ROW_GAP = 8;
const TAP_SLOP = 12; // 移動超過這距離(px)才「開始拖曳」;之內放開都算「戳」

type Props = {
  mood: PetMood;
  streak: number;
  hp: number;
  hpMax: number;
  reviveProgress?: number;
  reviveDays?: number;
  spriteSize?: number;
  groundHeight?: number;
  /** 小雞站在哪(視窗寬度的百分比)。之後畫了走路循環,改這個值她就會走。 */
  x?: number;
  equippedHead?: "bow" | "cap" | "crown" | null;
  equippedNeck?: "scarf" | null;
  /** 被「戳一下」時呼叫(健康/吃土/幽靈都會觸發)。外層在這裡播台詞。 */
  onPoke?: () => void;
  /** 要顯示的台詞泡泡。sub 只有幽靈的文言文翻譯才有。null = 不顯示。 */
  talk?: { text: string; sub?: string } | null;
};

const ChickGround = forwardRef<HTMLDivElement, Props>(function ChickGround(
  {
    mood,
    streak,
    hp,
    hpMax,
    reviveProgress = 0,
    reviveDays = 3,
    spriteSize = 128,
    groundHeight = 44,
    x = 12,
    equippedHead = null,
    equippedNeck = null,
    onPoke,
    talk = null,
  },
  ref,
) {
  // ---- 拖曳狀態 ----
  // grabbed = 現在正被拎著嗎。這是「狀態切換」,用 state 沒問題(不是每幀)。
  const [grabbed, setGrabbed] = useState(false);
  // ghostBlip = 幽靈被點了、正在播一次驚訝。播完自動回 dead。
  const [ghostBlip, setGhostBlip] = useState(false);
  const chickRef = useRef<HTMLDivElement | null>(null);
  const dragOrigin = useRef({ px: 0, py: 0 });
  // 開始拖曳那一刻,小雞在視窗裡的位置與大小。clamp 邊界要用。
  const startRect = useRef({ left: 0, top: 0, width: 0, height: 0 });
  const blipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 這次 pointer 互動的起點 —— 用來分辨「戳」和「拖」。不進 state(不需要 render)。
  const pointerStart = useRef({ x: 0, y: 0, moved: false, active: false });

  const dead = mood === "dead"; // 用「真實」mood 判斷是不是幽靈

  // ★ 幽靈抓不住(虛體)。只有健康時能拖。
  const canGrab = !dead;

  // 顯示的狀態:
  //   幽靈被點 → surprised 播一次
  //   其他     → 原本的 mood
  // 註:拖動時「不」切成 held 姿勢——因為配件(衣服)在 held 那列是空白的,
  //    切 held 會讓衣服整個消失/掉隊。改成保持正常姿勢、連衣服一起「板板正正」
  //    被整塊拖走(拖動只是移動位置,不改姿勢),這樣穿戴著也能一起拖。
  const shownMood: PetMood = ghostBlip ? "surprised" : mood;

  const junk = shownMood === "junk";

  const scale = Math.max(1, Math.round(spriteSize / CELL));
  const sprite = CELL * scale;
  const footGap = FOOT_ROW_GAP * scale;
  const spriteBottom = groundHeight - footGap;

  const ground = dead ? "#3A3444" : mood === "junk" ? "#8B6F3E" : "#E0A92E";
  const groundShade = dead ? "#282331" : mood === "junk" ? "#6B5430" : "#C08D1C";

  const totalH = spriteBottom + sprite;

  // ---- 互動處理 ----

  function onPointerDown(e: ReactPointerEvent) {
    // 不管什麼狀態,先記下起點。戳 / 拖的判定都靠它。
    pointerStart.current = { x: e.clientX, y: e.clientY, moved: false, active: true };
    // ★ capture 要抓在 currentTarget（掛事件的小雞容器，穩定不變），
    //   不是 e.target（按下當下指標下的子元素，例如衣服圖層/SVG）——
    //   子元素在拖曳中會被 React 換掉，capture 就失效 → 滑出視窗放不開 → 卡住。
    //   這也是「穿衣服更容易卡」的原因（衣服圖層當 target 更不穩）。
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    // 幽靈:抓不住,但戳一下會嚇一跳(虛體被戳到)。
    //   台詞照樣在「放開」時透過 onPoke 觸發,這裡只管驚訝動畫。
    if (dead) {
      if (!ghostBlip) {
        setGhostBlip(true);
        if (blipTimer.current) clearTimeout(blipTimer.current);
        // surprised 一輪 ≈ 0.7s，播完回 dead。
        blipTimer.current = setTimeout(() => setGhostBlip(false), 700);
      }
      return; // 不進拖曳,但 pointerStart 已記錄 → 放開時仍能算戳
    }

    // 吃土:不給拎,但可以被戳(放開時吐槽)。
    if (!canGrab) return;

    // 健康:先把拖曳要用的資料準備好,但「還不」拎起來。
    // 等指針真的移動超過 TAP_SLOP(在 onPointerMove 才切 grabbed)——
    // 「只是想戳一下」就不會誤觸拎起,這是這次調整的重點。
    e.preventDefault();
    dragOrigin.current = { px: e.clientX, py: e.clientY };
    const r = chickRef.current?.getBoundingClientRect();
    if (r) startRect.current = { left: r.left, top: r.top, width: r.width, height: r.height };
    // ★ 這裡不再 setGrabbed(true) —— 拎起來延後到「確定在拖」。
  }

  function onPointerMove(e: ReactPointerEvent) {
    if (!pointerStart.current.active) return;

    // 還沒判定成拖曳前,先看這次移動有沒有跨過門檻。
    let dragging = grabbed;
    if (!pointerStart.current.moved) {
      const mx = e.clientX - pointerStart.current.x;
      const my = e.clientY - pointerStart.current.y;
      if (mx * mx + my * my > TAP_SLOP * TAP_SLOP) {
        pointerStart.current.moved = true;
        // ★ 跨過門檻的這一刻,才真正把她拎起來(健康才 canGrab)。
        //   在門檻內放開 → moved 一直是 false → 算「戳」,絕不會拎起。
        if (canGrab && !grabbed) {
          setGrabbed(true);
          dragging = true; // setGrabbed 非同步,這幀先用區域旗標讓她立刻跟手
        }
      }
    }

    if (!dragging || !chickRef.current) return;

    const dx = e.clientX - dragOrigin.current.px;
    const dy = e.clientY - dragOrigin.current.py;

    // ★ 把小雞夾在視窗內。startRect 是開始拖曳那一刻小雞的位置,
    //   加上位移後不能讓她的邊界超出視窗。
    const { left, top, width, height } = startRect.current;
    const m = 8; // 邊界留白
    const clampedDx = Math.max(m - left, Math.min(window.innerWidth - m - width - left, dx));
    const clampedDy = Math.max(m - top, Math.min(window.innerHeight - m - height - top, dy));

    chickRef.current.style.transform = `translateX(-50%) translate(${clampedDx}px, ${clampedDy}px)`;
  }

  // 放開 / 取消都走這裡。poke=true 才有機會算成「戳」。
  function endPointer(poke: boolean) {
    // 戳成立的條件:這次互動有效、而且從頭到尾沒移動過。
    const tapped = poke && pointerStart.current.active && !pointerStart.current.moved;
    pointerStart.current.active = false;

    // 若正被拎著 → 掉回地面(健康才會 grabbed)。
    if (grabbed) {
      setGrabbed(false);
      if (chickRef.current) {
        chickRef.current.style.transition = "transform 0.35s cubic-bezier(.5,0,.9,.6)";
        chickRef.current.style.transform = "translateX(-50%)";
        window.setTimeout(() => {
          if (chickRef.current) chickRef.current.style.transition = "";
        }, 360);
      }
    }

    // 戳成立 → 通知外層播台詞(健康 / 吃土 / 幽靈都算)。
    if (tapped) onPoke?.();
  }

  function onPointerUp() {
    endPointer(true);
  }
  function onPointerCancel() {
    endPointer(false); // 被系統打斷(例如瀏覽器接手手勢)不算戳
  }

  // 保險:元件卸載時清掉狀態和計時器。
  useEffect(() => {
    return () => {
      setGrabbed(false);
      if (blipTimer.current) clearTimeout(blipTimer.current);
    };
  }, []);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 pointer-events-none"
      style={{ height: totalH }}
    >
      {/* 地面 */}
      <div
        className="dither absolute inset-x-0 bottom-0 border-t-[3px] border-black"
        style={
          {
            height: groundHeight,
            "--dither-a": groundShade,
            "--dither-b": ground,
          } as CSSProperties
        }
      />

      {/* 吃土:地上揚起的塵 */}
      {mood === "junk" &&
        [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <span
            key={i}
            className="dust-mote absolute w-[4px] h-[4px] bg-[#6B5430]"
            style={{
              bottom: groundHeight - 4,
              left: `${6 + i * 12}%`,
              animationDelay: `${i * 0.38}s`,
            }}
          />
        ))}

      {/* 小雞本人。pointer-events-auto 讓她可以被點(外層是 none)。
          canGrab 時游標變成「可抓」的手。 */}
      <div
        ref={(node) => {
          chickRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        className="absolute pointer-events-auto touch-none"
        style={{
          bottom: spriteBottom,
          // 用 clamp 夾住水平位置：中心離左右邊至少「半個身體 + 8px」。
          // 窄螢幕（手機）時自動往內縮，不會被切掉；寬螢幕維持原本的 x%。
          left: `clamp(${sprite / 2 + 8}px, ${x}%, calc(100% - ${sprite / 2 + 8}px))`,
          transform: "translateX(-50%)",
          // 幽靈:一般游標(抓不住,只能戳)。健康:可抓的手。
          cursor: dead ? "pointer" : !canGrab ? "pointer" : grabbed ? "grabbing" : "grab",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        {/* 像素影子:被拎起來時淡掉(她離開地面了) */}
        {!dead && (
          <span
            className="absolute left-1/2 -translate-x-1/2 bg-black/25 transition-opacity"
            style={{
              bottom: footGap - 4,
              width: sprite * 0.48,
              height: 6,
              opacity: grabbed ? 0.1 : 1,
            }}
          />
        )}

        {/* 幽靈一律加 ghost-float(飄浮),包含被戳出驚訝時 —— 虛體感要一直在。
            健康被拎(held)時不飄,讓拖曳的位移主導。 */}
        <div className={dead ? "ghost-float" : undefined}>
          <PetSprite
            mood={shownMood}
            streak={streak}
            equippedHead={equippedHead}
            equippedNeck={equippedNeck}
            size={sprite}
          />
        </div>

        {/* ---- 戳一下的台詞泡泡 ----
            幽靈會多一行文言文翻譯(sub)。她被拎著時(grabbed)不顯示,別擋著玩。
            外層兩層:外層負責定位(頭頂上方),內層負責 pop 進場動畫,
            這樣進場的 scale 不會跟外層的 translateX 打架(跟 CoinBurst 同招)。

            站位:x=12% 在螢幕左邊 → 泡泡略往右長(translateX(-30%)),
            避免貼著左緣被切掉。你的美術若改了 x,連這裡的 translateX 一起調。
            pointer-events-none:泡泡不吃點擊,才不會擋到再戳一下。 */}
        {!grabbed && talk && (
          <div
            className="absolute z-10 pointer-events-none"
            style={{ bottom: sprite + 6, left: "50%", transform: "translateX(-30%)" }}
            aria-live="polite"
          >
            <div
              key={talk.text} // 換一句台詞就重播一次 pop
              className="talk-pop relative border-2 border-black bg-white text-black px-2.5 py-1.5 text-[11px] font-black leading-snug"
              style={{ maxWidth: "min(64vw, 240px)", width: "max-content" }}
            >
              <span className="block">{talk.text}</span>
              {talk.sub && (
                <span className="block mt-1 text-[10px] font-bold text-black/55">
                  {talk.sub}
                </span>
              )}
              {/* 像素小尾巴,指向小雞。不想要就刪掉這行。 */}
              <span
                className="absolute w-[10px] h-[10px] bg-white border-b-2 border-r-2 border-black"
                style={{ left: 18, bottom: -6, transform: "rotate(45deg)" }}
                aria-hidden
              />
            </div>
          </div>
        )}

        {/* 狀態氣泡:被拎起來時不顯示(她正忙著被玩)。
            另外:正在講話(talk)時也先讓位，避免跟戳一下的台詞泡泡疊在一起。
            台詞約 3.5 秒後消失，狀態泡泡就自己回來。 */}
        {!grabbed && !talk && (dead || mood === "junk") && (
          <div
            className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-black px-2.5 py-1 border-2 border-black ${
              dead ? "bg-white text-black" : "bg-[#BB0015] text-white"
            }`}
            style={{ bottom: sprite - footGap + 8 }}
          >
            {dead ? `復活進度 ${reviveProgress}/${reviveDays}` : "吃土中…"}
          </div>
        )}
      </div>

      {/* HP 低:地面泛紅警示 */}
      {!dead && hp / hpMax <= 0.34 && (
        <div
          className="danger-scan absolute inset-x-0 bottom-0"
          style={{ height: groundHeight }}
        />
      )}
    </div>
  );
});

export default ChickGround;

/** 內容區要留的 padding-bottom(把地面條和小雞的高度讓出來) */
export function groundClearance(spriteSize = 128, groundHeight = 44) {
  const scale = Math.max(1, Math.round(spriteSize / CELL));
  return groundHeight - FOOT_ROW_GAP * scale + CELL * scale + 16;
}