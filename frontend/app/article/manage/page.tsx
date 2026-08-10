"use client";
import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { SquarePen, House } from "lucide-react";
import Pagination from "@/components/articlePagination";
import ArticleThumbnail from "@/components/article-thumbnail";
import { Button } from "@/components/ui/button";
import { getArticleSummary } from "@/lib/article-preview";
import SearchBar from "../_components/search_bar";
import { useToast } from "../_components/article_toast";
import Link from "next/link";
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

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsis, faBookmark } from "@fortawesome/free-solid-svg-icons";
import Cookies from "js-cookie";
import { useConfirm } from "@/app/_components/ConfirmModal";

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

interface UserArticle {
	id: string;
	title: string;
	content: string;
	date: string;
}

interface UserArticlesResponse {
	articles: UserArticle[];
}

export default function ArticleManagePage() {
	const router = useRouter();
	const pathname = usePathname();
	const { showToast } = useToast();
	const { confirmComponent, showConfirm } = useConfirm();
	const [categories, setCategories] = React.useState<Category[]>([]);
	const [userArticles, setUserArticles] = React.useState<UserArticle[]>([]);
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
		window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
	};
	const getArticleDetailHref = (articleId: string) => {
		const params = new URLSearchParams({
			from: "my-article",
			returnTo: `${pathname}?page=${currentPage}`,
		});

		return `/article/${articleId}?${params.toString()}`;
	};

	const fetchUserArticles = async (
		subCategoryId?: number,
		keyword?: string,
	) => {
		const params = new URLSearchParams();
		// params.append("user_id", "1");
		const token = Cookies.get("token");
		if (subCategoryId) {
			params.append("sub_cat_id", String(subCategoryId));
		}
		if (keyword?.trim()) {
			params.append("keyword", keyword);
		}
		const res = await fetch(`/api/article/user-articles?${params.toString()}`, {
			method: "GET",
			headers: { Authorization: `Bearer ${token}` },
		});
		if (!res.ok) throw new Error("Fetch failed");
		const data: UserArticlesResponse = await res.json();
		const nextArticles = Array.isArray(data.articles) ? data.articles : [];
		setUserArticles(nextArticles);
		return nextArticles;
	};
	const totalPages = Math.ceil(userArticles.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const paginatedArticles = userArticles.slice(
		startIndex,
		startIndex + itemsPerPage,
	);

	//savedCount
	React.useEffect(() => {
		userArticles.forEach((art) => {
			fetch(`/api/article/saved-count?article_id=${art.id}`)
				.then((r) => r.json())
				.then((data) =>
					setSavedCounts((prev) => ({ ...prev, [art.id]: data.saved.count })),
				);
		});
	}, [userArticles]);

	// 刪除文章
	const handleDeleteArticle = async (articleId: string) => {
		const isConfirm = await showConfirm("刪除後將無法復原，確定要刪除這篇文章嗎？", {
			title: "刪除文章？",
			confirmLabel: "確認刪除",
		});
		if (!isConfirm) return;
		try {
			const token = Cookies.get("token");
			const response = await fetch(`/api/article/articles/${articleId}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});
			console.log(response);
			if (!response.ok) {
				throw new Error("後端刪除失敗");
			}
			const data = await response.json();
			if (data.success) {
				showToast("文章已成功刪除！");
				setUserArticles((prevArticles) =>
					prevArticles.filter((art) => art.id !== articleId),
				);
			}
		} catch (error) {
			console.error("刪除請求出錯:", error);
			showToast("刪除失敗，請檢查網路或稍後再試。");
		}
	};

	React.useEffect(() => {
		const initAllData = async () => {
			try {
				setLoading(true);

				const catResponse = await fetch("/api/article/categories");
				if (!catResponse.ok) throw new Error("Fetch failed");

				const catData: CategoriesResponse = await catResponse.json();
				setCategories(catData.category);
				const initialArticles = await fetchUserArticles();
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

	if (loading) {
		return <div className="p-6 text-center">資料載入中，請稍候...</div>;
	}

	return (
		<>
			{confirmComponent}
			<div className="min-h-screen">
				<div className="max-w-7xl mx-auto w-full py-4">
					<div className="relative border-2 border-black">
						<div
							className="absolute inset-0 opacity-[0.5] pointer-events-none"
							style={{
								backgroundImage: "url('/article/noise.png')",
								backgroundRepeat: "repeat",
								backgroundSize: "90px",
							}}
						/>
						<div className="relative z-10">
							<div className="flex flex-col md:flex-row items-stretch md:items-center w-full justify-between gap-3 p-3 bg-black">
								<div className="flex w-full min-w-0 flex-1 items-center">
									<Link
										href="/article"
										className="flex h-10 w-10 shrink-0 items-center justify-center bg-black text-white hover:bg-gray-800"
									>
										<House size={22} />
									</Link>
									<Menubar className="flex h-auto min-w-0 overflow-x-auto whitespace-nowrap bg-black text-slate-100 border-0 md:h-10 md:flex-nowrap">
										<MenubarMenu>
											<MenubarTrigger
												className={
													selectedSubCategory === ""
														? "bg-gray-600 hover:bg-gray-400"
														: undefined
												}
												onClick={async () => {
													setSelectedSubCategory("");
													setCurrentPage(1);
													updatePageInUrl(1);
													await fetchUserArticles();
												}}
											>
												全部
											</MenubarTrigger>
										</MenubarMenu>
										<div className="mx-1 h-5 w-px bg-gray-500 self-center"></div>

										{loading ? (
											<div className="px-3 text-sm text-gray-400 self-center">
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
																onValueChange={async (value) => {
																	setSelectedSubCategory(value);
																	setCurrentPage(1);
																	updatePageInUrl(1);
																	fetchUserArticles(Number(value));
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
								<div className="flex items-center gap-2 w-full md:w-auto md:max-w-md">
									<div className="border-white border flex-1 min-w-0">
										<SearchBar
											onSearch={(keyword) => {
												fetchUserArticles(
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
									<Link
										href="/article/edit"
										className="flex w-10 h-10 bg-black items-center justify-center border-white border shrink-0"
									>
										<SquarePen color="#FFFFFF" />
									</Link>
								</div>
							</div>
							{/* breadcrumb */}
							<div className="p-4">
								<div className="flex justify-between items-center">
									<Breadcrumb>
										<BreadcrumbList>
											<BreadcrumbItem>
												<BreadcrumbLink render={<Link href="/">首頁</Link>} />
											</BreadcrumbItem>
											<BreadcrumbSeparator />
											<BreadcrumbItem>
												<BreadcrumbPage>我的文章</BreadcrumbPage>
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
								<div className="mt-4 border-b border-black" />
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
												className="flex gap-3 border-b border-black py-4 sm:gap-4"
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
													<div className="flex min-w-0 items-start justify-between gap-2">
														<h3 className="min-w-0 flex-1 font-bold text-lg leading-6 text-slate-900">
															{art.title}
														</h3>
														<div className="flex shrink-0 items-center gap-1 sm:gap-3">
															<p className="whitespace-nowrap text-xs text-gray-500">
																{art.date}
															</p>
															<DropdownMenu>
																<DropdownMenuTrigger
																	className="flex h-8 w-8 items-center justify-center text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none"
																	aria-label={`管理文章：${art.title}`}
																>
																	<FontAwesomeIcon icon={faEllipsis} />
																</DropdownMenuTrigger>
																<DropdownMenuContent
																	align="end"
																	className="min-w-20 text-center"
																>
																	<DropdownMenuItem
																		className="cursor-pointer justify-center"
																		onClick={() =>
																			router.push(`/article/edit?id=${art.id}`)
																		}
																	>
																		編輯
																	</DropdownMenuItem>
																	<DropdownMenuItem
																		className="cursor-pointer justify-center text-red-600 focus:text-red-600"
																		onClick={() => handleDeleteArticle(art.id)}
																	>
																		刪除
																	</DropdownMenuItem>
																</DropdownMenuContent>
															</DropdownMenu>
														</div>
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
															href={getArticleDetailHref(art.id)}
															className="shrink-0"
														>
															<Button
																variant="outline"
																size="sm"
																className="h-7 border-black bg-red-600 px-3 text-xs text-slate-100 hover:bg-red-700 hover:text-white"
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
