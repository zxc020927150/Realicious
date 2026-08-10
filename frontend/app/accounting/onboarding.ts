// onboarding.ts
// 判斷「打開記帳頁時，要不要跑教學 / 歡迎回來」。
//
// 設計原則（延續你的單一真相來源）：
//   - 不加資料庫欄位。全部從 txs（記帳紀錄）算出來。
//   - 新用戶 = 一筆帳都沒有 → 跑教學（記了第一筆就自動不再跑）
//   - 久違回歸 = 有舊帳，但最後一次記帳超過 N 天 → 小雞說歡迎回來
//   - 其他 = 正常使用，什麼都不做
//
// 視覺（黑幕、聚光燈、氣泡）不在這裡，交給畫面層。
// 這裡只回傳「現在是哪種狀態」。

import type { Tx } from "./api";

// 幾天沒記帳算「久違」
export const WELCOME_BACK_DAYS = 30;

export type OnboardingState =
	| { type: "tutorial" } // 新用戶：跑教學
	| { type: "welcomeBack"; days: number } // 久違：小雞歡迎回來（days = 幾天沒來）
	| { type: "none" }; // 正常：什麼都不做

// 把 "2026-07-28" 轉成 Date（當地時間的當天）
function keyToDate(key: string): Date {
	const [y, m, d] = key.split("-").map(Number);
	return new Date(y, m - 1, d);
}

// 兩個日期相差幾天（只看日期，不看時間）
function daysBetween(a: Date, b: Date): number {
	const MS = 24 * 60 * 60 * 1000;
	const da = new Date(a.getFullYear(), a.getMonth(), a.getDate());
	const db = new Date(b.getFullYear(), b.getMonth(), b.getDate());
	return Math.round((db.getTime() - da.getTime()) / MS);
}

export function getOnboardingState(
	txs: Tx[],
	today = new Date(),
): OnboardingState {
	// 完全沒記過帳 → 新用戶 → 教學
	if (txs.length === 0) {
		return { type: "tutorial" };
	}

	// 找出最後一次記帳的日期（txs 的 date 是 ISO 字串，字串比大小 = 日期比大小）
	let latestKey = txs[0].date;
	for (const t of txs) {
		if (t.date > latestKey) latestKey = t.date;
	}

	const gap = daysBetween(keyToDate(latestKey), today);

	// 超過門檻沒記帳 → 久違回歸
	if (gap >= WELCOME_BACK_DAYS) {
		return { type: "welcomeBack", days: gap };
	}

	// 正常使用
	return { type: "none" };
}
