"use client";

import { useMemo, useState } from "react";
import type { Tx } from "./api";

/* ============================================================
   分類圓餅圖（甜甜圈）—— 零依賴，純 SVG 手畫
   支援「支出 / 收入」切換：上面兩顆鈕，圖跟著換算對應類型。

   ---- 甜甜圈怎麼畫（看懂就會自己畫圖了）----
   一個圓的「周長」= 2πr。把每個分類的金額換算成「佔周長的幾分之幾」，
   用 stroke-dasharray 畫「一段實線 + 一段空白」，再用 stroke-dashoffset
   把每一段推到正確起點，一段接一段繞成一圈。
     ‧ dasharray  = `${該段長度} ${剩下的周長}`  → 只畫這一段
     ‧ dashoffset = -起始長度                     → 把這段推到接續位置
   整個 <g> 轉 -90 度，讓第一段從 12 點鐘開始。

   月份的過濾在外層做好再傳進來（傳 monthTxs），這裡只依 mode 分「支出/收入」。
   ============================================================ */

// 各分類固定配色 —— 同一分類每次同色，使用者記得住。
const CAT_COLORS: Record<string, string> = {
  // 支出
  餐飲: "#BB0015", // 主紅
  飲品: "#E0A92E", // 金
  交通: "#4C6B8A", // 藍灰
  學習: "#5B8C5A", // 綠
  娛樂: "#FFD45C", // 主黃
  服飾: "#8B6F3E", // 棕
  // 收入
  薪資: "#2E7D5A", // 深綠
  其他收入: "#C9772F", // 橘
};
const FALLBACK = ["#7A5C99", "#C9772F", "#3A3444", "#A63D57"];

type Mode = "expense" | "income";
type Slice = { cat: string; amount: number; color: string; pct: number; start: number };

export default function SpendingPie({ txs }: { txs: Tx[] }) {
  const [mode, setMode] = useState<Mode>("expense");

  // 依目前 mode（支出 / 收入）把當月資料分類加總、排序、算佔比與起點
  const { slices, total } = useMemo(() => {
    const sums = new Map<string, number>();
    for (const t of txs) {
      if (t.type !== mode) continue;
      sums.set(t.category, (sums.get(t.category) ?? 0) + t.amount);
    }
    const total = [...sums.values()].reduce((s, n) => s + n, 0);

    const raw = [...sums.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount], i) => ({
        cat,
        amount,
        color: CAT_COLORS[cat] ?? FALLBACK[i % FALLBACK.length],
        pct: total > 0 ? Math.round((amount / total) * 100) : 0,
      }));

    // 每段起點 = 前面所有段金額總和（前綴和）。用 reduce 直接算，不改變數。
    const slices: Slice[] = raw.map((s, i) => ({
      ...s,
      start: raw.slice(0, i).reduce((sum, x) => sum + x.amount, 0),
    }));

    return { slices, total };
  }, [txs, mode]);

  const isExpense = mode === "expense";
  const label = isExpense ? "支出" : "收入";

  // ---- 甜甜圈幾何 ----
  const R = 32;
  const STROKE = 16;
  const C = 2 * Math.PI * R;
  const GAP = 2;

  return (
    <div className="border-[3px] border-black bg-white p-4 mb-4">
      {/* 標題 + 支出/收入切換鈕 */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[13px] font-bold">本月{label}分類</div>
        <div className="flex gap-1">
          {(["expense", "income"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 text-[11px] font-black border-2 border-black transition-colors ${
                mode === m ? "bg-[#FFD45C]" : "bg-white hover:bg-[#F3F3F3]"
              } cursor-pointer`}
            >
              {m === "expense" ? "支出" : "收入"}
            </button>
          ))}
        </div>
      </div>

      {total === 0 ? (
        // 這個月這個類型沒有資料 → 空狀態（切換鈕仍在上面，可切回去）
        <div className="text-[12px] font-bold text-black/45 text-center py-6">
          這個月還沒有{label}，記一筆就會出現囉
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* 甜甜圈本體 */}
          <div className="relative shrink-0" style={{ width: 132, height: 132 }}>
            <svg viewBox="0 0 100 100" width={132} height={132}>
              <circle cx={50} cy={50} r={R + STROKE / 2} fill="none" stroke="#000" strokeWidth={2} />
              <circle cx={50} cy={50} r={R - STROKE / 2} fill="none" stroke="#000" strokeWidth={2} />
              <g transform="rotate(-90 50 50)">
                {slices.map((s) => {
                  const dash = (s.amount / total) * C;
                  const draw = Math.max(0.5, dash - GAP);
                  const offset = (s.start / total) * C;
                  return (
                    <circle
                      key={s.cat}
                      cx={50}
                      cy={50}
                      r={R}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={STROKE}
                      strokeDasharray={`${draw} ${C - draw}`}
                      strokeDashoffset={-offset}
                    />
                  );
                })}
              </g>
            </svg>

            {/* 甜甜圈中間：本月該類型總額。
                數字太長（例如一千萬）會撐破中間的洞 → 依字數自動縮小字體、
                限制寬度、不換行，多長都塞得進去、不破圖。 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2">
              <span className="text-[9px] font-bold text-black/50">本月{label}</span>
              {(() => {
                const totalStr = `$${total.toLocaleString()}`;
                const len = totalStr.length;
                const fs = len <= 6 ? 15 : len <= 8 ? 12 : len <= 10 ? 10 : 8;
                return (
                  <span
                    className="font-black leading-tight whitespace-nowrap"
                    style={{ fontSize: fs, maxWidth: 60 }}
                  >
                    {totalStr}
                  </span>
                );
              })()}
            </div>
          </div>

          {/* 圖例：分類 / 佔比 / 金額 */}
          <ul className="flex-1 w-full flex flex-col gap-1.5">
            {slices.map((s) => (
              <li key={s.cat} className="flex items-center gap-2 text-[12px] font-bold">
                <span
                  className="shrink-0 w-3 h-3 border border-black"
                  style={{ background: s.color }}
                />
                <span className="flex-1 truncate">{s.cat}</span>
                <span className="text-black/55 tabular-nums">{s.pct}%</span>
                <span className="w-20 text-right tabular-nums whitespace-nowrap">
                  ${s.amount.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}