import type { Metadata } from "next";
import HomeClient from "@/app/_components/HomeClient";

export const metadata: Metadata = {
	title: {
		default: "Realicious 食刻",
		template: "%s | Realicious",
	},
	description: "首頁 — 美食交流、商品與記帳功能總覽",
};

export default function HomePage() {
	return <HomeClient />;
}
