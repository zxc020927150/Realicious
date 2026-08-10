import Link from "next/link";
import PetSprite from "../accounting/pixel/PixelSpriteSheet";
import "../accounting/pixel/fx.css";

const CELL = 64;
const FOOT_ROW_GAP = 8;
const SPRITE = 192; // 必須是 64 的整數倍
const GROUND_H = 72;

const scale = SPRITE / CELL;
const chickBottom = GROUND_H - FOOT_ROW_GAP * scale; // 腳踩在地面線上

// 背景飄浮的像素方塊。寫死座標而不用 Math.random()，
// 因為隨機值在伺服器和瀏覽器會算出不同結果 → hydration 錯誤。
const MOTES = [
  { l: "6%", t: "18%", s: 8, o: 0.14 },
  { l: "14%", t: "62%", s: 5, o: 0.1 },
  { l: "23%", t: "30%", s: 6, o: 0.12 },
  { l: "38%", t: "14%", s: 5, o: 0.09 },
  { l: "46%", t: "48%", s: 9, o: 0.13 },
  { l: "57%", t: "24%", s: 6, o: 0.1 },
  { l: "68%", t: "66%", s: 5, o: 0.11 },
  { l: "79%", t: "20%", s: 7, o: 0.12 },
  { l: "88%", t: "52%", s: 5, o: 0.09 },
  { l: "94%", t: "34%", s: 6, o: 0.13 },
];

export default function AccountingSection() {
  return (
    <section className="relative w-full overflow-hidden bg-[#1A1721]">
      {/* 飄浮的像素粒子 */}
      {MOTES.map((m, i) => (
        <span
          key={i}
          className="absolute bg-[#FFD45C]"
          style={{
            left: m.l,
            top: m.t,
            width: m.s,
            height: m.s,
            opacity: m.o,
          }}
          aria-hidden
        />
      ))}

      {/* 抖色地面：直接引用記帳頁的地面色。
          .dither 和 --dither-a/b 都定義在 fx.css。 */}
      <div
        className="dither absolute inset-x-0 bottom-0 border-t-[3px] border-black"
        style={
          {
            height: GROUND_H,
            ["--dither-a" as string]: "#C08D1C",
            ["--dither-b" as string]: "#E0A92E",
          } as React.CSSProperties
        }
        aria-hidden
      />

      <div
        className="relative max-w-5xl mx-auto px-5 pt-20"
        style={{ paddingBottom: GROUND_H + 32 }}
      >
        <div className="flex flex-col md:flex-row items-center md:items-end justify-center gap-10 md:gap-16">
          <div
            className="relative shrink-0"
            style={{ height: SPRITE, marginBottom: -(GROUND_H + 32) + chickBottom }}
          >
            <span
              className="absolute left-1/2 -translate-x-1/2 bg-black/35"
              style={{ bottom: FOOT_ROW_GAP * scale - 4, width: SPRITE * 0.48, height: 6 }}
              aria-hidden
            />
            <PetSprite mood="idle" streak={30} equippedHead="crown" size={SPRITE} />
          </div>

          <div className="text-center md:text-left md:pb-4">
            <p className="font-bold tracking-wider text-[#FFD45C]">PIXEL PET</p>

            <h2 className="mt-2 text-4xl md:text-5xl font-black text-white">
              今天花了多少？
            </h2>

            <p className="mt-4 text-lg text-white/70 leading-relaxed">
              記一筆帳，餵一次小雞。
              <br className="hidden md:block" />
              連續記帳解鎖新配件，超支她就陪你一起吃土。
            </p>

            <div className="mt-7 flex flex-wrap gap-2 justify-center md:justify-start">
              {["每日預算", "連續打卡", "衣櫃收集"].map((t) => (
                <span
                  key={t}
                  className="text-[12px] font-bold px-3 py-1.5 border-2 border-white/25 text-white/80"
                >
                  {t}
                </span>
              ))}
            </div>

            <Link
              href="/accounting"
              className="inline-block mt-7 bg-[#FFD45C] text-black font-black text-lg px-8 py-4 border-[3px] border-black transition-transform hover:-translate-y-1"
            >
              開始記帳
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}