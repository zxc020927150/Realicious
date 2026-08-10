"use client";

import * as React from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark } from "@fortawesome/free-solid-svg-icons";
import ArticleThumbnail from "@/components/article-thumbnail";
import { getArticleSummary } from "@/lib/article-preview";

interface PopularArticle {
	id: string;
	title: string;
	content: string;
	updated_at: string;
	_count: {
		saved_article: number;
	};
}

interface PopularArticlesResponse {
	popular_article: PopularArticle[];
}

export default function ArticleSection() {
	const [popular_articles, setPopularArticles] = React.useState<
		PopularArticle[]
	>([]);
	const [loading, setLoading] = React.useState(true);

	React.useEffect(() => {
		const fetchArticles = async () => {
			try {
				setLoading(true);
				const response = await fetch("/api/article/popular-articles");
				if (!response.ok) throw new Error("Fetch failed");
				const data: PopularArticlesResponse = await response.json();
				setPopularArticles(
					Array.isArray(data.popular_article) ? data.popular_article : [],
				);
			} catch (error) {
				if ((error as Error).name !== "AbortError") {
					console.error("Error fetching popular articles:", error);
				}
			} finally {
				setLoading(false);
			}
		};

		fetchArticles();
	}, []);

	return (
		<section>
			<div className="max-w-7xl mx-auto">
				<div className="mb-12">
					<p className="text-[#BB0015] font-bold">POPULAR ARTICLES</p>
					<h2 className="text-4xl font-bold mt-2">熱門文章</h2>
				</div>

				<div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
					{loading ? (
						<p className="text-slate-500">文章載入中...</p>
					) : popular_articles.length === 0 ? (
						<p className="text-slate-500">目前沒有文章。</p>
					) : (
						popular_articles.map((popular_article) => (
							<Link
								key={popular_article.id}
								href={`/article/${popular_article.id}`}
								className="block shadow hover:shadow-xl transition overflow-hidden bg-white hover:-translate-y-2"
							>
								<article className="flex flex-col h-full w-full">
									<div className="relative w-full aspect-video bg-gray-200 shrink-0 overflow-hidden">
										<ArticleThumbnail
											content={popular_article.content}
											title={popular_article.title}
											width={640}
											height={360}
											className="h-full w-full bg-white object-cover"
										/>
									</div>
									<div className="p-6 flex flex-col flex-1">
										<h3 className="font-bold text-xl line-clamp-2 h-14 leading-snug">
											{popular_article.title}
										</h3>
										<p className="mt-3 text-slate-500 line-clamp-2 h-10 text-sm leading-relaxed">
											{getArticleSummary(popular_article.content)}
										</p>
										<div className="mt-auto pt-5 flex justify-between text-sm text-slate-400 border-t border-slate-100">
											<span>
												<FontAwesomeIcon icon={faBookmark} />
												收藏 {popular_article._count.saved_article} 次
											</span>
											<span>{popular_article.updated_at}</span>
										</div>
									</div>
								</article>
							</Link>
						))
					)}
				</div>
			</div>
		</section>
	);
}
