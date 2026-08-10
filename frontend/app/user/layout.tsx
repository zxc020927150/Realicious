import type { Metadata } from "next";
import "./user.css";
import AmbientBackground from "@/components/AmbientBackground";

export const metadata: Metadata = {
	title: {
		default: "會員中心",
		template: "%s | Realicious",
	},
	description: "管理會員帳戶與設定",
};

export default function UserLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		// <div className="py-4 bg-[#fafafa] bg-[url(/user/always-grey.png)] bg-repeat bg-size-32px_32px">
		<div className="relative min-h-screen overflow-hidden sm:py-4 md:py-6 lg:py-8 xl:py-10 2xl:py-12 ">
			<AmbientBackground />
			<div className="relative z-10">{children}</div>
		</div>
	);
}
