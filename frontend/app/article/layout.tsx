import type { Metadata } from "next";

export const metadata: Metadata = {
	title: {
		default: "文章",
		template: "%s | Realicious",
	},
	description: "瀏覽美食文章",
};

export default function ArticleLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return <div className="article-page">{children}</div>;
}
