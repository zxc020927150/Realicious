import type { Metadata } from "next";
import "@/app/accounting/pixel/fx.css";
import "./shop-theme.css";
import ShopAmbientBackground from "./_components/ShopAmbientBackground";

export const metadata: Metadata = {
	title: {
		default: "商城",
		template: "%s | Realicious",
	},
	description: "瀏覽商品與優惠",
};

export default function ShopLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="shop-theme relative min-h-full">
			<ShopAmbientBackground />
			<div className="relative">{children}</div>
		</div>
	);
}
