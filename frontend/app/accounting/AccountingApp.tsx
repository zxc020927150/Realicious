"use client";

import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { getChickTalk } from "./chickTalk";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBurger, faMugHot, faTrainSubway, faBook, faGamepad, faShirt,
  faSackDollar, faGift, faCircleQuestion,faBoxOpen, faCalendarDay, faPen, faXmark, faCheck,
  faLock, faRibbon, faCrown, faHatCowboy,faHandPointer,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import BudgetCalendar from "./BudgetCalendar";
import SpendingPie from "./SpendingPie";
import ChickGround, { groundClearance } from "./pixel/ChickGround";
import AmbientBackground from "./pixel/AmbientBackground";
import CoinBurst, { useCountUp } from "./pixel/CoinBurst";
import type { PetMood } from "./pixel/PixelSpriteSheet";
import {
  type Tx,
  fetchTxs,
  fetchBudget,
  fetchPet,
  createTx,
  updateTx,
  deleteTx,
  saveBudget,
  savePet,
} from "./api";
import { getOnboardingState } from "./onboarding";
import TutorialSpotlight from "./pixel/TutorialSpotlight";
import WalkingChick from "./pixel/WalkingChick";
import LoadingTransition from "./pixel/LoadingTransition";
import { useToast } from "@/app/context/toast";

/* ============================================================
   設計 TOKEN（來自 Component 規範）
   白 #FFFFFF ｜ 卡片/次要 #FCF9F6 ｜ 輸入框 #E3E3E3
   主紅 #BB0015 ｜ 主黃 #FFD45C ｜ 純黑 #000 純白 #FFF
   按鈕陰影：Y軸 4px、純黑、不羽化 → shadow-[0_4px_0_#000]
   ============================================================ */
const CARD = "bg-[#FCF9F6] border-[3px] border-black shadow-[0_4px_0_#000]";
const BTN =
  "btn-chunky border-[3px] border-black shadow-[0_4px_0_#000] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFD45C]";
const FIELD =
  "w-full bg-[#E3E3E3] border-[3px] border-black px-3 py-2.5 text-[14px] rounded-none placeholder:text-black/35 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FFD45C]";

/* ---------- 遊戲規則（想調就改這裡） ---------- */
const HP_MAX = 100;
const HP_GAIN = 20; // 有記帳 +20
const HP_LOSS = 34; // 斷一天 -34（3 天歸零）
const REVIVE_DAYS = 3; // 死後連續記帳 3 天復活
// 解鎖天數與名稱。衣櫃 modal 裡直接寫死了對應（bow=3, scarf=7...），
// 這兩個保留給之後可能的「里程碑清單」用，目前沒有直接引用。
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const OUTFIT_MILESTONES = [3, 7, 14, 30];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const OUTFIT_NAMES = ["蝴蝶結", "圍巾", "鴨舌帽", "王冠"];

// 小雞的尺寸。SPRITE 必須是 64 的整數倍（128 = 2x, 192 = 3x）。
// 非整數倍會讓瀏覽器把你的硬邊補成半透明鬼影。
const SPRITE = 128;
const GROUND_H = 44;

// 單筆金額 / 每日預算的上限（一千萬）。
// 資料庫 INT 上限約 21 億，超過會存不了；設一千萬遠低於它、又夠日常記帳用，
// 從輸入就夾住，就不會產生爆表數字（存不了）或超長數字（跑版）。
const MAX_AMOUNT = 10_000_000;
// 把使用者打的字轉成「只留數字、去開頭0、夾在上限內」的字串
const clampAmountInput = (raw: string) => {
  const digits = raw.replace(/[^0-9]/g, "").replace(/^0+/, "");
  if (digits === "") return "";
  return String(Math.min(Number(digits), MAX_AMOUNT));
};

const CATS: Record<string, { icon: typeof faBurger; type: "income" | "expense" }> = {
  餐飲: { icon: faBurger, type: "expense" },
  飲品: { icon: faMugHot, type: "expense" },
  交通: { icon: faTrainSubway, type: "expense" },
  學習: { icon: faBook, type: "expense" },
  娛樂: { icon: faHandPointer, type: "expense" }, 
  服飾: { icon: faShirt, type: "expense" },
  薪資: { icon: faSackDollar, type: "income" },
  其他收入: { icon: faGift, type: "income" },
};
const WEEK = ["日", "一", "二", "三", "四", "五", "六"];

const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

/* ============================================================
   每月預算：存在瀏覽器 localStorage（不動後端 / 不動 DB）。
   一個 key 存全部月份：realicious:budgets = {"2026-07":600,"2026-08":400}
   ‧ 某個月有設定 → 用它；沒有 → 用後端傳來的 daily_budget 當預設值。
   ‧ 改某個月的預算，只寫那個月 → 其他月份不受影響（＝只影響單月）。
   （這是過渡做法：只存在這台瀏覽器。之後要做成後端版可再升級。） */
const BUDGETS_LS_KEY = "realicious:budgets";
function loadMonthBudgets(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(BUDGETS_LS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}
function saveMonthBudgets(map: Record<string, number>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BUDGETS_LS_KEY, JSON.stringify(map));
  } catch {
    // localStorage 滿了或被禁用就算了，不影響主要功能
  }
}
const keyToDate = (k: string) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const fmtDay = (d: Date) =>
  `${d.getMonth() + 1} 月 ${d.getDate()} 日（週${WEEK[d.getDay()]}）`;
const daysBetween = (a: Date, b: Date) =>
  Math.round((b.getTime() - a.getTime()) / 86400000);

/* ---------- 小雞狀態計算 ----------
   從「有記帳的日子」推算 HP、連續天數、生死、復活進度         */
function calcPet(txs: Tx[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = toKey(today);

  // ★ 只看「今天（含）以前」有記帳的日子。
  //   未來的帳（例如先登記 8/1 的訂閱）存著、顯示在日曆上、算進預算，
  //   但「不影響小雞的健康」—— 你未來會花的錢，不該讓今天的小雞餓死。
  const logged = [...new Set(txs.map((t) => t.date))]
    .filter((k) => k <= todayKey) // ISO 字串字典序 = 時間序，可以直接比大小
    .sort();

  if (logged.length === 0) {
    return { hp: HP_MAX, streak: 0, alive: true, reviveProgress: 0, loggedToday: false };
  }

let hp = HP_MAX;
  let dead = false;   // 現在是不是死的
  let run = 0;        // 死後連續記帳幾天（復活進度）
  let prev: Date | null = null;

  for (const k of logged) {
    const d = keyToDate(k);

    if (prev) {
      const gap = daysBetween(prev, d) - 1; // 中間斷了幾天
      if (gap > 0) {
        hp = Math.max(0, hp - gap * HP_LOSS);
        run = 0;                   // 斷了 → 復活進度歸零
        if (hp === 0) dead = true;
      }
    }

    if (dead) {
      // 死掉的時候 HP 卡在 0，要連續記帳 REVIVE_DAYS 天才復活
      run++;
      if (run >= REVIVE_DAYS) {
        dead = false;
        hp = HP_GAIN * REVIVE_DAYS; // 復活，HP 回到 60
        run = 0;
      }
    } else {
      hp = Math.min(HP_MAX, hp + HP_GAIN);
    }

    prev = d;
  }

  // 從最後一次記帳到今天，中間斷掉的天數也要扣
  const last = keyToDate(logged[logged.length - 1]);
  const gapToToday = daysBetween(last, today);
  if (gapToToday > 0) {
    hp = Math.max(0, hp - gapToToday * HP_LOSS);
    if (gapToToday >= 2) run = 0; // 昨天也沒記 → 復活進度歸零（今天還沒過完，不算）
    if (hp === 0) dead = true;
  }

  // 連續天數（從今天或昨天往回數）
  let streak = 0;
  const set = new Set(logged);
  const cur = new Date(today);
  if (!set.has(toKey(cur))) cur.setDate(cur.getDate() - 1);
  while (set.has(toKey(cur))) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }

  const alive = !dead;
  return {
    hp,
    streak,
    alive,
    reviveProgress: dead ? Math.min(run, REVIVE_DAYS) : 0,
    loggedToday: set.has(toKey(today)),
  };
}

export default function AccountingApp({ pixel }: { pixel: string }) {
  const { showToast } = useToast();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [defaultBudget, setDefaultBudget] = useState(500); // 後端來的每日預算，當「預設值」
  const [monthBudgets, setMonthBudgets] = useState<Record<string, number>>({}); // 每月覆寫（localStorage）
  const [petName, setPetName] = useState("米粒");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("米粒");
  // 衣櫃：目前戴的頭飾 / 圍巾，還有衣櫃彈窗開關
  const [equippedHead, setEquippedHead] = useState<"bow" | "cap" | "crown" | null>(null);
  const [equippedNeck, setEquippedNeck] = useState<"scarf" | null>(null);
  const [showWardrobe, setShowWardrobe] = useState(false);
    // 月曆現在顯示哪個月。從 BudgetCalendar 提上來（lifting state up），
  // 因為「本月結餘」也要用同一個月份。
  const [calMonth, setCalMonth] = useState(new Date());
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<Date>(new Date());

  // 登入判斷：沒有 token 就踢去登入頁
  // authOk: null=還在確認 / false=沒登入（先顯示提示燈箱再跳轉）/ true=放行
  const router = useRouter();
  const [authOk, setAuthOk] = useState<boolean | null>(null);

  useEffect(() => {
    // Cookies.get 要在瀏覽器才讀得到（SSR 沒有 document），所以判斷放在 effect 裡。
    if (!Cookies.get("token")) {
      // 未登入：先讓畫面顯示「請先登入」的燈箱，停 1.5 秒讓使用者看清楚，
      // 再導去登入頁 —— 不然畫面「啪」一下跳走，使用者根本不知道發生什麼事。
      // 兩個 setState/導頁都包進 setTimeout callback，避開 React 19 同步 setState 警告。
      const show = setTimeout(() => setAuthOk(false), 0);
      const go = setTimeout(() => router.replace("/user/login"), 1500);
      
      return () => {
        clearTimeout(show);
        clearTimeout(go);
      };
    }
    // 有 token → 放行。用 setTimeout(…, 0) 讓 setState 下一輪才跑，
    // 避開「effect 裡同步 setState 會連鎖 render」的警告，跟「久違回歸」那個 effect 同招。
    const id = setTimeout(() => setAuthOk(true), 0);
    return () => clearTimeout(id);
  }, [router]);

  const stageRef = useRef<HTMLDivElement>(null);
  const [burst, setBurst] = useState(0); // 每 +1 噴一次金幣
  const [justFed, setJustFed] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [tutorialSkipped, setTutorialSkipped] = useState(false);
  const addBtnRef = useRef<HTMLButtonElement | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showBudget, setShowBudget] = useState(false);
  const [junkMode, setJunkMode] = useState(false);
  const [junkDismissed, setJunkDismissed] = useState(false);
  const [pokeCount, setPokeCount] = useState(0);
  const [talk, setTalk] = useState<{ text: string; sub?: string } | null>(null);

  // 表單
  const [fType, setFType] = useState<"expense" | "income">("expense");
  const [fCat, setFCat] = useState("餐飲");
  const [fAmt, setFAmt] = useState("");
  const [fNote, setFNote] = useState("");
  const [budgetInput, setBudgetInput] = useState("500");

  const onboarding = useMemo(() => getOnboardingState(txs), [txs]);

  useEffect(() => {
    (async () => {
      try {
        const [t, b, p] = await Promise.all([fetchTxs(), fetchBudget(), fetchPet()]);
        setTxs(t);
        setDefaultBudget(b.budget);
        setBudgetInput(String(b.budget));
        setMonthBudgets(loadMonthBudgets()); // 讀出本機存的每月預算
        setJunkMode(b.junkMode);
        setPetName(p.petName);
        setNameInput(p.petName);
        setEquippedHead(p.equippedHead);
        setEquippedNeck(p.equippedNeck);
      } catch (e) {
        console.error("[lia] 載入失敗", e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

useEffect(() => {
    if (!loaded) return;

    if (onboarding.type === "welcomeBack") {
      // 用 setTimeout 讓它下一輪才執行，避開 React 19 的同步 setState 警告
      const id = setTimeout(() => {
        setTalk({
          text: `好久不見！你${onboarding.days}天沒來了，本雞都長灰了…(´;ω;\`)`,
        });
      }, 0);
      return () => clearTimeout(id);
    }
    // onboarding.type === "tutorial" → 交給美術做的教學元件去讀這個狀態
  }, [loaded, onboarding]);

// 台詞泡泡:出現後自動消失。每戳一次 getChickTalk 都回傳新物件 →
// talk 參考變了 → 這個 effect 重跑 → 計時器重置,連戳不會提早消失。
useEffect(() => {
  if (!talk) return;
  const id = setTimeout(() => setTalk(null), 3500);
  return () => clearTimeout(id);
}, [talk]);

  // 換頭飾（擇一，再點同一個 = 脫下）
  const toggleHead = async (item: "bow" | "cap" | "crown") => {
    const next = equippedHead === item ? null : item;
    const prev = equippedHead;
    setEquippedHead(next); // 先改畫面
    try {
      await savePet({ equippedHead: next });
      showToast(next ? "幫小雞換好頭飾了" : "脫下頭飾了");
    } catch (e) {
      console.error("[lia] 換頭飾失敗", e);
      setEquippedHead(prev); // 失敗回復
    }
  };

  // 換圍巾（獨立，可跟頭飾並存）
  const toggleNeck = async () => {
    const next = equippedNeck === "scarf" ? null : "scarf";
    const prev = equippedNeck;
    setEquippedNeck(next);
    try {
      await savePet({ equippedNeck: next });
      showToast(next ? "戴上圍巾了" : "脫下圍巾了");
    } catch (e) {
      console.error("[lia] 換圍巾失敗", e);
      setEquippedNeck(prev);
    }
  };

const saveName = async () => {
    const n = nameInput.trim().slice(0, 8);
    if (!n) {
      setNameInput(petName);
      setEditingName(false);
      return;
    }
    setPetName(n);          // 先改畫面
    setEditingName(false);
    try {
      await savePet({ petName: n });
      showToast(`已改名為「${n}」`);
    } catch (e) {
        // 名字被後端擋下來是「預期中的正常結果」（不是程式壞掉），
        // 所以用 console.warn 而不是 console.error —— 後者會讓 Next.js 跳出
        // 嚇人的紅色錯誤浮層。使用者的提示已經由下面的小雞對話泡泡負責。
        console.warn("[lia] 改名被擋下或失敗：", e);
        setPetName(petName);
        setNameInput(petName);
        setTalk({ text: e instanceof Error ? e.message : "改名失敗了" });
      }
  };

  const pet = useMemo(() => calcPet(txs), [txs]);

  const mood: PetMood = !pet.alive
    ? "dead"
    : junkMode
      ? "junk"
      : justFed
        ? "happy"
        : pet.loggedToday
          ? "idle"
          : "hungry";

  const selKey = toKey(selected);
  const dayTxs = txs.filter((t) => t.date === selKey);
  const spent = dayTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const earned = dayTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    // 本月結餘：當月收入 − 當月支出
  const monthKey = toKey(calMonth).slice(0, 7);
  const monthTxs = txs.filter((t) => t.date.slice(0, 7) === monthKey);
  const monthIncome = monthTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = monthIncome - monthExpense;

  // 「本日預算」看的是選到那一天所屬的月份。
  // 那個月有自己設定就用它，否則用後端預設值 → 改某月不影響別月。
  const budgetMonthKey = toKey(selected).slice(0, 7);
  const budget = monthBudgets[budgetMonthKey] ?? defaultBudget;

  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  const over = spent > budget;
  const pokeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePoke = () => {
    const next = pokeCount + 1;
    setPokeCount(next);
  setTalk(
      getChickTalk({
        name: petName,
        hp: pet.hp,
        streak: pet.streak,
        alive: pet.alive,
        loggedToday: pet.loggedToday,
        isOver: junkMode,
        justFed,
        pokeCount: next,
      })
    );
    if (pokeTimer.current) clearTimeout(pokeTimer.current);
    pokeTimer.current = setTimeout(() => setPokeCount(0), 3000);
  };
  const spentAnim = useCountUp(spent); // 金額用「數」的，不要用「跳」的

  const spendDays = useMemo(
    () => [...new Set(txs.filter((t) => t.type === "expense").map((t) => t.date))].map(keyToDate),
    [txs],
  );
  const incomeDays = useMemo(
    () => [...new Set(txs.filter((t) => t.type === "income").map((t) => t.date))].map(keyToDate),
    [txs],
  );

  const overDays = useMemo(() => {
    // 每一天用「它自己那個月」的預算來判斷超支（沒設定就用預設值）
    const budgetOfDay = (dayKey: string) =>
      monthBudgets[dayKey.slice(0, 7)] ?? defaultBudget;
    const sum = new Map<string, number>();
    for (const t of txs) {
      if (t.type !== "expense") continue;
      sum.set(t.date, (sum.get(t.date) ?? 0) + t.amount);
    }
    return [...sum.entries()]
      .filter(([key, total]) => total > budgetOfDay(key))
      .map(([key]) => keyToDate(key));
  }, [txs, monthBudgets, defaultBudget]);

  const catsOfType = Object.keys(CATS).filter((k) => CATS[k].type === fType);

const addTx = async () => {
    const amt = Number(fAmt);
    if (!amt || amt <= 0) return;
    if (amt > MAX_AMOUNT) {
      // 保險：正常從輸入就夾住了，這裡擋住其他途徑塞進來的爆表數字
      showToast(`金額上限為 $${MAX_AMOUNT.toLocaleString()}`);
      return;
    }

    const payload = {
      date: selKey,
      category: fCat,
      name: fNote.trim() || fCat,
      amount: amt,
      type: fType,
    };

    try {
      if (editingId) {
        const updated = await updateTx(editingId, payload);
        setTxs((p) => p.map((t) => (t.id === editingId ? updated : t)));
      } else {
        const created = await createTx(payload);
        setTxs((p) => [created, ...p]);
      }
    } catch (e) {
      console.error("[lia] 儲存失敗", e);
      alert("儲存失敗");
      return;
    }

    // editingId 這時還是原本的值（下面才 setEditingId(null)），可以用來判斷是新增還是編輯
    showToast(editingId ? "已更新這筆記錄" : "已記帳，餵飽小雞了");

    setFAmt("");
    setFNote("");
    setShowAdd(false);
    setEditingId(null);
    setJunkDismissed(false);

    if (!editingId) {
      setBurst((n) => n + 1);
      setJustFed(true);
      setTimeout(() => setJustFed(false), 1300);
    }

    // 復活小提醒：小雞現在是幽靈，卻記了「未來日期」的帳 → 這筆不會幫忙復活，
    // 講一句讓使用者知道規則（modal 這時已關，小雞露出來，泡泡看得到）。
    if (!pet.alive && selKey > toKey(new Date())) {
      setTalk({ text: "記未來的帳不會幫我復活喔，要記今天或補記過去的！" });
    }
  };

  const delTx = async (id: string) => {
    const backup = txs;
    setTxs((p) => p.filter((t) => t.id !== id)); // 先在畫面上拿掉，不要等
    try {
      await deleteTx(id);
      showToast("已刪除這筆記錄");
    } catch (e) {
      console.error("[lia] 刪除失敗", e);
      setTxs(backup); // 失敗就放回去
      alert("刪除失敗");
    }
  };

  const openEdit = (tx: Tx) => {
    setEditingId(tx.id);
    setFType(tx.type);
    setFCat(tx.category);
    setFAmt(String(tx.amount));
    setFNote(tx.name);
    setSelected(keyToDate(tx.date));
    setShowAdd(true);
  };
  // 還在確認登入 → 先不畫，避免閃一下
  if (authOk === null) return null;

  // 未登入 → 顯示提示燈箱；上面的 effect 會在 1.5 秒後把人導到登入頁。
  // 規格跟其他 modal 一致：黑幕 + FCF9F6 卡片 + lightbox-pop 進場動畫（fx.css 已有）。
  if (authOk === false) {
    return (
      <div className="fixed inset-0 z-[80] bg-black/60 grid place-items-center p-4">
        <div className="lightbox-pop bg-[#FCF9F6] border-[3px] border-black shadow-[0_4px_0_#000] p-6 w-full max-w-[320px] text-center">
          <div className="text-[16px] font-black mb-2">還沒登入喔</div>
          <p className="text-[12px] font-bold text-black/60 leading-relaxed">
            記帳小雞要登入才能陪你，
            <br />
            正在帶你去登入頁…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="max-w-[1100px] mx-auto flex flex-col gap-5"
      style={{ paddingBottom: groundClearance(SPRITE, GROUND_H) }}
    >
      {/* ============ 背景氛圍層（會跟著小雞的狀態變） ============ */}
      <AmbientBackground
        mood={!pet.alive ? "dead" : junkMode ? "junk" : "normal"}
        intensity={Math.min(1, pet.streak / 30)}
        danger={1 - pet.hp / HP_MAX}
      />
      <CoinBurst fire={burst} originRef={stageRef} />

{onboarding.type === "tutorial" && !showAdd && !tutorialSkipped && (
  <TutorialSpotlight
    targetRef={addBtnRef}
    onSkip={() => setTutorialSkipped(true)}
  />
)}

{/* <LoadingTransition /> */}

      <section className={`${CARD} p-4 md:p-5`} aria-label="小雞狀態">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-[3px] bg-black" />
            {editingName ? (
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveName();
                  if (e.key === "Escape") {
                    setNameInput(petName);
                    setEditingName(false);
                  }
                }}
                autoFocus
                maxLength={8}
                aria-label="小雞名字"
                className="w-[110px] bg-[#E3E3E3] border-2 border-black px-2 py-1 text-[14px] font-black text-center rounded-none focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FFD45C]cursor-pointer"
              />
            ) : (
              <button
                onClick={() => setEditingName(true)}
                title="點一下改名字"
                className="group flex items-center gap-1.5 px-1 cursor-pointer"
              >
                <span className="text-[15px] font-black cursor-pointer">{petName}</span>
                <span className="text-[11px] opacity-30 group-hover:opacity-100 cursor-pointer">
                <FontAwesomeIcon icon={faPen} />
                </span>
              </button>
            )}
            <div className="flex-1 h-[3px] bg-black" />
          </div>

          {/* HP 與 STREAK 並排，不再上下堆疊 —— 省一半高度 */}
          <div className="grid md:grid-cols-2 gap-3 mb-3">
            <Bar label="HP" val={`${pet.hp}/${HP_MAX}`} pct={pet.hp} color="bg-[#BB0015]" pixel={pixel} />
            <Bar
              label="STREAK"
              val={`${pet.streak} 天`}
              pct={Math.min(100, (pet.streak / 30) * 100)}
              color="bg-[#FFD45C]"
              pixel={pixel}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 今日打卡狀態 */}
            <div
              className={`flex-1 min-w-[220px] border-[3px] border-black px-3 py-2 text-[12px] font-bold text-center ${
                pet.loggedToday ? "bg-[#FFD45C]" : "bg-white"
              }`}
            >
              {!pet.alive
                ? `${petName}變成幽靈了！連續記帳 ${REVIVE_DAYS} 天可復活（記今天或補記過去的才算，記未來的不算喔）`
                : junkMode
                  ? `預算超支，${petName}正陪你一起吃土…`
                  : pet.loggedToday
                    ? ` 今天已記帳，${petName}很滿足`
                    : `今天還沒記帳，${petName}餓了…`}
            </div>

            {/* 衣櫃入口。里程碑改到衣櫃裡呈現（鎖頭 + 解鎖天數）。 */}
            <button
              onClick={() => setShowWardrobe(true)}
              className={`${BTN} text-[12px] font-black px-3 py-1.5 bg-[#FFD45C] cursor-pointer`}
            >
              <FontAwesomeIcon icon={faBoxOpen} /> 衣櫃
            </button>
          </div>
      </section>

      {/* ============ 日曆 + 明細，左右並排，一眼看完 ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* 日曆 */}
        <section className={`lg:col-span-5 ${CARD} p-5`} aria-label="消費日曆">
          <BudgetCalendar
            selected={selected}
            onSelect={(d) => {
              if (!d) return;
              setSelected(d);
              // 若點到的是「外月」日期（例：畫面在 8 月，點了上排的 7/31），
              // 月曆跟著跳到那個月 → 「看的月份」永遠等於「選到的月份」，不會對不上。
              if (
                d.getMonth() !== calMonth.getMonth() ||
                d.getFullYear() !== calMonth.getFullYear()
              ) {
                setCalMonth(d);
              }
            }}
            spendDays={spendDays}
            incomeDays={incomeDays}
            month={calMonth}
            onMonthChange={(m) => {
              setCalMonth(m);
              // 跳月時，把「選中日期」也移到該月，下面的明細/預算/圓餅圖才會跟著同步，
              // 不會停在好幾個月前的舊日期。
              //   ‧ 跳到「今天所在的月份」→ 選今天（最貼近使用者當下）
              //   ‧ 跳到其他月份 → 選那個月的 1 號
              const today = new Date();
              const isThisMonth =
                m.getFullYear() === today.getFullYear() &&
                m.getMonth() === today.getMonth();
              setSelected(
                isThisMonth ? today : new Date(m.getFullYear(), m.getMonth(), 1),
              );
            }}
            overDays={overDays}
          />
          <div className="flex gap-3 mt-3 pt-3 border-t-2 border-dashed border-black/20 text-[11px] font-bold text-black/60">
            <span className="flex items-center gap-1.5">
              <i className="w-2.5 h-2.5 bg-[#BB0015] border border-black" />有支出
            </span>
            <span className="flex items-center gap-1.5">
              <i className="w-2.5 h-2.5 bg-black" />有收入
            </span>
            <span className="flex items-center gap-1.5">
              <i className="w-2.5 h-2.5 bg-[#FFD45C] border border-black" />已選取
            </span>
            <span className="flex items-center gap-1.5">
              <i className="w-2.5 h-2.5 bg-white border-2 border-[#BB0015]" />超支
            </span>
          </div>
        </section>

        <aside
          className={`lg:col-span-7 ${CARD} p-5 flex flex-col`}
          aria-label="記帳明細"
        >
        <div className="flex items-center justify-between mb-4">
          <h2 className={`${pixel} text-[15px]`}>記帳明細</h2>
          <button
              ref={addBtnRef}
              onClick={() => {
              setEditingId(null);
              setFAmt("");
              setFNote("");
              setShowAdd(true);
            }}
            aria-label="新增一筆記錄"
            className={`${BTN} w-10 h-10 bg-[#FFD45C] grid place-items-center text-[22px] font-black leading-none cursor-pointer`}
          >
            ＋
          </button>
        </div>

        {/* 本日預算 */}
        <div
          className={`border-[3px] border-black bg-white p-3.5 mb-4 ${over ? "shake-once" : ""}`}
          key={over ? "over" : "ok"}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[13px] font-bold">
              本日預算{" "}
              <span className={over ? "text-[#BB0015]" : ""}>
                ${spentAnim.toLocaleString()}
              </span>{" "}
              / ${budget.toLocaleString()}
            </span>
            <button
              onClick={() => {
                setBudgetInput(String(budget)); // 預填這個月目前的預算
                setShowBudget(true);
              }}
              className="text-[12px] font-bold text-[#BB0015] underline underline-offset-2 cursor-pointer"
            >
              <FontAwesomeIcon icon={faPen} /> 設定
            </button>
          </div>
          <div className="h-3.5 bg-[#E3E3E3] border-2 border-black">
            <div
              className={`h-full bar-fill ${over ? "bg-[#BB0015]" : "bg-[#FFD45C]"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {junkMode && (
            <div className="flex items-center justify-between mt-2.5">
              <span className="text-[11px] font-black px-2.5 py-1 bg-[#BB0015] text-white border-2 border-black">
                吃土模式中 · 超支 ${(spent - budget).toLocaleString()}
              </span>
              <button
                onClick={() => {
                  setJunkMode(false);
                  saveBudget({ junkMode: false }).catch((e) =>
                    console.error("[lia] 吃土模式儲存失敗", e),
                  );
                  setJunkDismissed(true);
                }}
                className="text-[11px] font-bold underline underline-offset-2 text-black/50 cursor-pointer cursor-pointer"
              >
                關閉
              </button>
            </div>
          )}
        </div>

        {/* 本月分類圓餅圖（甜甜圈）。放在「本月結餘」上面：先給視覺總覽、再給精確數字。
            monthTxs 已依 calMonth 過濾，跟本月結餘同一個月。 */}
        <SpendingPie txs={monthTxs} />

        {/* 本月結餘 */}
        <div className="border-[3px] border-black bg-white p-3.5 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-[13px] font-bold">本月結餘</span>
            <span
              className={`${pixel} text-[15px] ${
                balance >= 0 ? "text-black" : "text-[#BB0015]"
              }`}
            >
              {balance >= 0 ? "" : "-"}${Math.abs(balance).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-[11px] font-bold text-black/50 mt-1.5">
            <span>收入 ${monthIncome.toLocaleString()}</span>
            <span>支出 ${monthExpense.toLocaleString()}</span>
          </div>
        </div>

        {/* 選到的日期 */}
        <div className="flex justify-between items-center mb-3 text-[13px] font-bold">
              <span>
                <FontAwesomeIcon icon={faCalendarDay} /> {fmtDay(selected)}
              </span>
          <span>
            支出 <span className="text-[#BB0015]">${spent.toLocaleString()}</span>
            {earned > 0 && <span className="ml-2">收入 ${earned.toLocaleString()}</span>}
          </span>
        </div>

        {/* 明細。 */}
        <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
          {dayTxs.length === 0 ? (
            <div className="border-[3px] border-dashed border-black/25 p-10 text-center text-[13px] font-bold text-black/40">
              這天還沒有記錄，按右上角 ＋ 記一筆
            </div>
          ) : (
            dayTxs.map((tx, i) => (
              <div
                key={tx.id}
                className="row-in flex items-center gap-3 border-[3px] border-black bg-white px-3.5 py-3"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="w-9 h-9 shrink-0 border-2 border-black grid place-items-center text-[18px] bg-[#FCF9F6]">
                  <FontAwesomeIcon icon={CATS[tx.category]?.icon ?? faCircleQuestion} />
                </div>
                <div className="flex-1 min-w-0 text-[14px] font-bold truncate">{tx.name}</div>
                <span className="text-[11px] font-bold px-2 py-1 bg-[#E3E3E3] border-2 border-black shrink-0">
                  {tx.category}
                </span>
                <span
                  className={`${pixel} text-[12px] min-w-[70px] text-right shrink-0 whitespace-nowrap ${
                    tx.type === "income" ? "text-black" : "text-[#BB0015]"
                  }`}
                >
                  {tx.type === "income" ? "+" : "-"}${tx.amount.toLocaleString()}
                </span>
                
                <button
                  onClick={() => openEdit(tx)}
                  aria-label="編輯"
                  className="shrink-0 w-6 h-6 grid place-items-center text-black/40 hover:text-black text-[14px] cursor-pointer"
                >
                  <FontAwesomeIcon icon={faPen} />
                </button>
                <button
                  onClick={() => delTx(tx.id)}
                  aria-label="刪除"
                  className="shrink-0 w-6 h-6 grid place-items-center text-black/40 hover:text-[#BB0015] text-[16px] cursor-pointer"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            ))
          )}
          </div>
        </aside>
      </div>

      {/* ============ 新增記帳 Modal ============ */}
      {showAdd && (
        <div
          className="fixed inset-0 z-[70] bg-black/55 grid place-items-center p-4"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="bg-[#FCF9F6] border-[3px] border-black shadow-[0_4px_0_#000] p-6 w-full max-w-[360px]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[16px] font-black mb-4">
              {editingId ? "編輯這筆記錄" : "新增一筆記錄"}
            </h3>

            <div className="flex gap-2 mb-4">
              {(["expense", "income"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setFType(t);
                    setFCat(Object.keys(CATS).filter((k) => CATS[k].type === t)[0]);
                  }}
                  className={`flex-1 border-[3px] border-black py-2 text-[14px] font-black ${
                    fType === t ? "bg-[#BB0015] text-white" : "bg-white "
                  }cursor-pointer`}
                >
                  {t === "expense" ? "支出" : "收入"}
                </button>
              ))}
            </div>

            <label className="block text-[12px] font-bold mb-1.5  cursor-pointer ">分類</label>
            <select
              value={fCat}
              onChange={(e) => setFCat(e.target.value)}
              className={`${FIELD} mb-4 cursor-pointer`}
            >
              {catsOfType.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>

            <label className="block text-[12px] font-bold mb-1.5">金額 ($)</label>
            <input
              type="text"
              inputMode="numeric"
              value={fAmt ? Number(fAmt).toLocaleString() : ""}
              onChange={(e) => setFAmt(clampAmountInput(e.target.value))}
              onKeyDown={(e) => e.key === "Enter" && addTx()}
              placeholder="0"
              autoFocus
              className={`${FIELD} ${pixel} mb-1`}
            />
            <p className="text-[10px] font-bold text-black/40 mb-4">
              上限 ${MAX_AMOUNT.toLocaleString()}
            </p>

            <label className="block text-[12px] font-bold mb-1.5">備註（選填）</label>
            <input
              type="text"
              value={fNote}
              onChange={(e) => setFNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTx()}
              placeholder="早餐、捷運…"
              className={`${FIELD} mb-5`}
            />

            <div className="flex gap-2.5">
              <button
                onClick={() => {
                setShowAdd(false);
                setEditingId(null);
              }}
                className={`${BTN} flex-1 bg-white py-2.5 text-[14px] font-bold cursor-pointer`}
              >
                取消
              </button>
              <button
                onClick={addTx}
                className={`${BTN} flex-1 bg-[#BB0015] text-white py-2.5 text-[14px] font-black cursor-pointer`}
              >
                {editingId ? "儲存" : "記帳 & 餵食"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ 預算設定 Modal ============ */}
      {showBudget && (
        <div
          className="fixed inset-0 z-[70] bg-black/55 grid place-items-center p-4"
          onClick={() => setShowBudget(false)}
        >
          <div
            className="bg-[#FCF9F6] border-[3px] border-black shadow-[0_4px_0_#000] p-6 w-full max-w-[320px]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[16px] font-black mb-1">
              設定每日預算
            </h3>
            <p className="text-[11px] font-bold text-black/50 mb-4">
              只會套用到 {budgetMonthKey} 這個月，其他月份不受影響
            </p>
            <label className="block text-[12px] font-bold mb-1.5">金額 ($)</label>
            <input
              type="text"
              inputMode="numeric"
              value={budgetInput ? Number(budgetInput).toLocaleString() : ""}
              onChange={(e) => setBudgetInput(clampAmountInput(e.target.value))}
              autoFocus
              className={`${FIELD} ${pixel} mb-1`}
            />
            <p className="text-[10px] font-bold text-black/40 mb-5">
              上限 ${MAX_AMOUNT.toLocaleString()}
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setShowBudget(false)}
                className={`${BTN} flex-1 bg-white py-2.5 text-[14px] font-bold cursor-pointer`}
              >
                取消
              </button>
              <button
                onClick={() => {
              const n = Number(budgetInput);
                if (n > 0) {
                  // 只改「這個月」（budgetMonthKey），其他月份不動 → 只影響單月
                  const next = { ...monthBudgets, [budgetMonthKey]: n };
                  setMonthBudgets(next);
                  saveMonthBudgets(next); // 寫進 localStorage
                  showToast("這個月的預算已更新");
                }
                  setShowBudget(false);
                  setJunkDismissed(false);
                }}
                className={`${BTN} flex-1 bg-[#BB0015] text-white py-2.5 text-[14px] font-black cursor-pointer`}
              >
                儲存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ 吃土模式提示（燈箱）============
           全螢幕遮罩 + flex 置中。用 flex 而不是絕對定位喬 px ——
           數學上絕對正中，永遠不會歪。跟記帳/預算/衣櫃 modal 一致。 */}
      {over && !junkMode && !junkDismissed && (
        <div
          className="fixed inset-0 z-[70] bg-black/55 grid place-items-center p-4"
          onClick={() => setJunkDismissed(true)}
        >
          <div
            className="lightbox-pop bg-[#FCF9F6] border-[3px] border-black shadow-[0_4px_0_#000] p-6 w-full max-w-[340px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[15px] font-black mb-2">今日已超出預算</div>
            <p className="text-[12px] font-bold text-black/60 mb-4 leading-relaxed">
              超出 ${(spent - budget).toLocaleString()}。要開啟「吃土模式」，讓 {petName} 陪你一起共體時艱嗎？
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setJunkDismissed(true)}
                className="flex-1 border-[3px] border-black bg-white py-2.5 text-[13px] font-bold cursor-pointer"
              >
                先不用
              </button>
              <button
                onClick={() => {
                  setJunkMode(true);
                  saveBudget({ junkMode: true }).catch((e) =>
                    console.error("[lia] 吃土模式儲存失敗", e),
                  );
                }}
                className="flex-1 border-[3px] border-black bg-[#BB0015] text-white py-2.5 text-[13px] font-black cursor-pointer"
              >
                開啟
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ 小雞住在這裡 ============
           滿版地面，釘在視窗底部。沒有邊框、沒有自己的天空 ——
           頁面就是天空，她從地上站起來，身體伸進你的內容區。
           x 是她站的位置（視窗寬度的 %）。之後畫了走路循環，
           把 x 接上動畫，她就會走。 */}
      <ChickGround
        equippedHead={equippedHead}
        equippedNeck={equippedNeck}
        ref={stageRef}
        mood={mood}
        streak={pet.streak}
        hp={pet.hp}
        hpMax={HP_MAX}
        reviveProgress={pet.reviveProgress}
        reviveDays={REVIVE_DAYS}
        spriteSize={SPRITE}
        groundHeight={GROUND_H}
        x={12}
        onPoke={handlePoke}   // ← 戳一下 → 播台詞
        talk={talk}           // ← 把氣泡內容交給 ChickGround 定位渲染
      />

      {/* ============ 衣櫃 Modal ============
           解鎖靠 streak（前端算，不進資料庫）。
           戴哪個是使用者的選擇 → 存進 user_pet.equipped（後端）。 */}
      {showWardrobe && (
        <div
          className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowWardrobe(false)}
        >
          <div
            className="bg-[#FCF9F6] border-[3px] border-black shadow-[0_4px_0_#000] p-6 w-full max-w-[360px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-[15px] font-black">
                <FontAwesomeIcon icon={faBoxOpen} /> {petName}的衣櫃
              </span>
              <button
                onClick={() => setShowWardrobe(false)}
                className="w-7 h-7 grid place-items-center border-2 border-black bg-white font-black"
                aria-label="關閉"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] font-bold text-black/50 mb-3">
              連續記帳解鎖新配件，點一下穿脫。
            </p>

            {/* 頭飾（擇一） */}
            <div className="text-[11px] font-black mb-1.5">頭飾（只能戴一個）</div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {([
                { id: "bow", name: "蝴蝶結", need: 3 },
                { id: "cap", name: "鴨舌帽", need: 14 },
                { id: "crown", name: "王冠", need: 30 },
              ] as const).map((it) => {
                const unlocked = pet.streak >= it.need;
                const on = equippedHead === it.id;
                return (
                  <button
                    key={it.id}
                    disabled={!unlocked}
                    onClick={() => toggleHead(it.id)}
                    className={`border-[3px] border-black p-2 text-[11px] font-black transition-transform ${
                      !unlocked
                        ? "bg-[#E3E3E3] text-black/30 cursor-not-allowed"
                        : on
                          ? "bg-[#BB0015] text-white"
                          : "bg-white hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="text-[20px] leading-none mb-1">
                      <FontAwesomeIcon
                        icon={
                          !unlocked
                            ? faLock
                            : on
                              ? faCheck
                              : it.id === "crown"
                                ? faCrown
                                : it.id === "cap"
                                  ? faHatCowboy
                                  : faRibbon
                        }
                      />
                    </div>
                    {it.name}
                    {!unlocked && (
                      <div className="text-[9px] font-bold mt-0.5">
                        {it.need}天解鎖
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 圍巾（獨立） */}
            <div className="text-[11px] font-black mb-1.5">圍巾（可跟頭飾並存）</div>
            <button
              disabled={pet.streak < 7}
              onClick={toggleNeck}
              className={`w-full border-[3px] border-black p-2.5 text-[12px] font-black transition-transform ${
                pet.streak < 7
                  ? "bg-[#E3E3E3] text-black/30 cursor-not-allowed"
                  : equippedNeck === "scarf"
                    ? "bg-[#BB0015] text-white"
                    : "bg-white hover:-translate-y-0.5"
              }`}
            >
              {pet.streak < 7 ? (
                <>
                  <FontAwesomeIcon icon={faLock} /> 圍巾 · 連續 7 天解鎖
                </>
              ) : equippedNeck === "scarf" ? (
                <>
                  <FontAwesomeIcon icon={faCheck} /> 已戴圍巾（再點脫下）
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faRibbon} /> 戴上圍巾
                </>
              )}
            </button>

            <div className="text-[10px] font-bold text-black/40 mt-4 text-center">
              目前連續 {pet.streak} 天
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Bar({
  label,
  val,
  pct,
  color,
  pixel,
}: {
  label: string;
  val: string;
  pct: number;
  color: string;
  pixel: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1 text-[11px] font-bold">
        <span>{label}</span>
        <span className={`${pixel} text-[10px]`}>{val}</span>
      </div>
      <div className="h-3.5 bg-[#E3E3E3] border-2 border-black">
        <div className={`h-full bar-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}