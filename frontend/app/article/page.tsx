"use client";
import * as React from "react";
import { House } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark } from "@fortawesome/free-solid-svg-icons";
import Pagination from "@/components/articlePagination";
import ArticleThumbnail from "@/components/article-thumbnail";
import { Button } from "@/components/ui/button";
import { getArticleSummary } from "@/lib/article-preview";
import SearchBar from "./_components/search_bar";
import Link from "next/link";
import AmbientBackground from "@/components/AmbientBackground";

import {
	Menubar,
	MenubarContent,
	MenubarMenu,
	MenubarRadioGroup,
	MenubarRadioItem,
	MenubarTrigger,
} from "@/components/ui/menubar";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface SubCategory {
	id: number;
	sub_category_name: string;
}

interface Category {
	category_name: string;
	sub_category: SubCategory[];
}

interface CategoriesResponse {
	category: Category[];
}

interface Article {
	id: string;
	title: string;
	content: string;
	date: string;
}

interface ArticlesResponse {
	article: Article[];
}

export default function ArticlePage() {
	const [categories, setCategories] = React.useState<Category[]>([]);
	const [articles, setArticles] = React.useState<Article[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [selectedSubCategory, setSelectedSubCategory] =
		React.useState<string>("");
	const [savedCounts, setSavedCounts] = React.useState<{
		[key: string]: number;
	}>({});
	const [currentPage, setCurrentPage] = React.useState(1);
	const itemsPerPage = 10;
	const updatePageInUrl = (page: number) => {
		const params = new URLSearchParams(window.location.search);
		params.set("page", String(page));
		window.history.replaceState(null, "", `/article?${params.toString()}`);
	};

	const fetchArticles = async (subCatId?: number, keyword?: string) => {
		const params = new URLSearchParams();

		//let url = "/api/article/articles";
		if (subCatId !== undefined) {
			params.append("sub_cat_id", String(subCatId));
		}
		if (keyword?.trim()) {
			params.append("keyword", keyword);
		}
		const query = params.toString();
		const artResponse = await fetch(
			query ? `/api/article/articles?${query}` : "/api/article/articles",
		);
		if (!artResponse.ok) {
			throw new Error(`Fetch articles failed: ${artResponse.status}`);
		}
		const artData: ArticlesResponse = await artResponse.json();
		const nextArticles = Array.isArray(artData.article) ? artData.article : [];
		setArticles(nextArticles);
		return nextArticles;
	};
	const totalPages = Math.ceil(articles.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const paginatedArticles = articles.slice(
		startIndex,
		startIndex + itemsPerPage,
	);

	React.useEffect(() => {
		const initAllData = async () => {
			try {
				setLoading(true);
				const catResponse = await fetch("/api/article/categories");
				if (!catResponse.ok) throw new Error("Fetch failed");
				const catData: CategoriesResponse = await catResponse.json();
				setCategories(catData.category);

				const initialArticles = await fetchArticles();
				const page = Number(
					new URLSearchParams(window.location.search).get("page"),
				);
				if (Number.isInteger(page) && page > 0) {
					const maxPage = Math.max(
						1,
						Math.ceil(initialArticles.length / itemsPerPage),
					);
					setCurrentPage(Math.min(page, maxPage));
				}
			} catch (error) {
				console.error("Error fetching categories:", error);
			} finally {
				setLoading(false);
			}
		};
		initAllData();
	}, []);

	//savedCount
	React.useEffect(() => {
		articles.forEach((art) => {
			fetch(`/api/article/saved-count?article_id=${art.id}`)
				.then((r) => r.json())
				.then((data) =>
					setSavedCounts((prev) => ({ ...prev, [art.id]: data.saved.count })),
				);
		});
	}, [articles]);

	return (
		<>
			<div className="relative min-h-screen overflow-hidden">
				<AmbientBackground />
				<div className="relative z-10 max-w-7xl mx-auto w-full py-4 px-2">
					<div className="relative border-5 border-black bg-[#FDFCF9]">
						<div
							className="absolute inset-0 opacity-[0.5] pointer-events-none"
							style={{
								backgroundImage: "url('/article/noise.png')",
								backgroundRepeat: "repeat",
								backgroundSize: "90px",
							}}
						/>
						<div className="relative z-10">
							{/* <div className="">
								<div className="font-pixel text-[120px] font-bold text-center tracking-[0.45em]">
									ARTICLES
								</div>
							</div> */}

							<div className="flex flex-col md:flex-row items-stretch md:items-center w-full justify-between gap-3 p-3 bg-black">
								<div className="flex w-full min-w-0 flex-1 items-center">
									<Link
										href="/"
										className="flex h-10 w-10 shrink-0 items-center justify-center bg-black text-white hover:bg-gray-800"
									>
										<House size={22} />
									</Link>
									<Menubar className="flex h-auto min-w-0 overflow-x-auto whitespace-nowrap bg-black text-slate-100 border-0 md:h-10 md:flex-nowrap">
										<MenubarMenu>
											<MenubarTrigger
												className={
													selectedSubCategory === ""
														? "bg-gray-600 hover:bg-gray-500"
														: undefined
												}
												onClick={() => {
													setSelectedSubCategory("");
													setCurrentPage(1);
													updatePageInUrl(1);
													fetchArticles();
												}}
											>
												全部
											</MenubarTrigger>
										</MenubarMenu>
										<div className="mx-1 h-5 w-px bg-gray-500 self-center"></div>
										{loading ? (
											<div className="px-3 text-sm text-gray-500 self-center">
												載入中...
											</div>
										) : (
											categories.map((cat, index) => (
												<React.Fragment key={cat.category_name}>
													<MenubarMenu>
														<MenubarTrigger
															className={
																cat.sub_category.some(
																	(sub) =>
																		String(sub.id) === selectedSubCategory,
																)
																	? "bg-gray-600 hover:bg-gray-400"
																	: undefined
															}
														>
															{cat.category_name}
														</MenubarTrigger>
														<MenubarContent>
															<MenubarRadioGroup
																value={selectedSubCategory}
																onValueChange={(value) => {
																	setSelectedSubCategory(value);
																	setCurrentPage(1);
																	updatePageInUrl(1);
																	fetchArticles(Number(value));
																}}
															>
																{cat.sub_category.map((sub) => (
																	<MenubarRadioItem
																		key={sub.id}
																		value={String(sub.id)}
																	>
																		{sub.sub_category_name}
																	</MenubarRadioItem>
																))}
															</MenubarRadioGroup>
														</MenubarContent>
													</MenubarMenu>
													{index < categories.length - 1 && (
														<div className="mx-1 h-5 w-px bg-gray-500 self-center" />
													)}
												</React.Fragment>
											))
										)}
									</Menubar>
								</div>
								<div className="flex w-full items-center gap-2 md:w-auto md:max-w-md">
									<div className="min-w-0 flex-1 border border-white">
										<SearchBar
											onSearch={(keyword) => {
												fetchArticles(
													selectedSubCategory
														? Number(selectedSubCategory)
														: undefined,
													keyword,
												);
												setCurrentPage(1);
												updatePageInUrl(1);
											}}
										/>
									</div>
								</div>
							</div>

							{/* breadcrumb */}
							<div className="p-4">
								<div className="flex flex-wrap items-center justify-between gap-3">
									<Breadcrumb>
										<BreadcrumbList className="text-sm">
											<BreadcrumbItem>
												<BreadcrumbLink render={<Link href="/">首頁</Link>} />
											</BreadcrumbItem>
											<BreadcrumbSeparator />
											<BreadcrumbItem>
												<BreadcrumbPage>文章列表</BreadcrumbPage>
											</BreadcrumbItem>
										</BreadcrumbList>
									</Breadcrumb>
									<Pagination
										currentPage={currentPage}
										totalPages={totalPages}
										setCurrentPage={setCurrentPage}
										onPageChange={updatePageInUrl}
									/>
								</div>
								{/* breadcrumb */}
								<div className="mt-4 border-b-2 border-black" />
							</div>

							{/* 文章列表 */}
							<div className="p-4 md:p-6">
								<div className="flex flex-col">
									{paginatedArticles.length === 0 ? (
										<p className="text-black text-center py-6">
											目前沒有任何文章。
										</p>
									) : (
										paginatedArticles.map((art) => (
											<div
												key={art.id}
												className="flex gap-3 border-b-2 border-black py-4 first:-mt-3 sm:gap-4"
											>
												<div className="relative min-h-36 w-32 shrink-0 self-stretch sm:w-40 md:w-44">
													<ArticleThumbnail
														content={art.content}
														title={art.title}
														width={176}
														height={132}
														className="absolute inset-0 h-full w-full border border-black bg-white object-cover"
													/>
												</div>
												<div className="flex min-w-0 flex-1 flex-col gap-2">
													<div className="flex min-w-0 items-start justify-between gap-3">
														<h3 className="min-w-0 flex-1 font-bold text-lg leading-6 text-slate-900">
															{art.title}
														</h3>
														<p className="shrink-0 whitespace-nowrap pt-1 text-xs text-gray-700">
															{art.date}
														</p>
													</div>
													<p className="line-clamp-3 wrap-break-word overflow-hidden text-base leading-6 text-gray-600">
														{getArticleSummary(art.content)}
													</p>
													<div className="mt-auto flex items-center justify-between gap-3">
														<div className="flex min-w-0 items-center gap-1 text-xs text-gray-500 sm:text-sm">
															<FontAwesomeIcon
																icon={faBookmark}
																className="shrink-0"
															/>
															<span>被收藏 {savedCounts[art.id] || 0} 次</span>
														</div>
														<Link
															href={`/article/${art.id}`}
															className="shrink-0"
														>
															<Button
																variant="outline"
																size="sm"
																className="h-7 border-black bg-red-600 px-3 text-xs text-slate-100 shadow-[2px_2px_0px_0px_#000]"
															>
																閱讀全文
															</Button>
														</Link>
													</div>
												</div>
											</div>
										))
									)}
								</div>
							</div>
							<div className="m-4 flex justify-end">
								<Pagination
									currentPage={currentPage}
									totalPages={totalPages}
									setCurrentPage={setCurrentPage}
									onPageChange={updatePageInUrl}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
