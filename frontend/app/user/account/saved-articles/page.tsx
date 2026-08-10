"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark } from "@fortawesome/free-solid-svg-icons";
import Cookies from "js-cookie";
import SearchBar from "@/app/article/_components/search_bar";
import { useToast } from "@/app/article/_components/article_toast";
import ArticleThumbnail from "@/components/article-thumbnail";
import Pagination from "@/components/articlePagination";
import { Button } from "@/components/ui/button";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
	Menubar,
	MenubarContent,
	MenubarMenu,
	MenubarRadioGroup,
	MenubarRadioItem,
	MenubarTrigger,
} from "@/components/ui/menubar";
import {
	getSavedArticles,
	removeSavedArticle,
	type SavedArticle,
} from "@/lib/article-saved";
import { getArticleSummary } from "@/lib/article-preview";
import AmbientBackground from "@/components/AmbientBackground";

interface SubCategory {
	id: number;
	sub_category_name: string;
}

interface Category {
	category_name: string;
	sub_category: SubCategory[];
}

interface CategoriesResponse {
	category?: Category[];
}

const ITEMS_PER_PAGE = 10;

async function getArticleCategories(signal: AbortSignal): Promise<Category[]> {
	const response = await fetch("/api/article/categories", { signal });
	if (!response.ok) throw new Error("文章分類載入失敗");

	const data = (await response.json()) as CategoriesResponse;
	return Array.isArray(data.category) ? data.category : [];
}

function getArticleDetailHref(articleId: string, returnTo: string): string {
	const params = new URLSearchParams({
		from: "saved-articles",
		returnTo,
	});

	return `/article/${articleId}?${params.toString()}`;
}

export default function SavedArticlesPage() {
	const pathname = usePathname();
	const [categories, setCategories] = React.useState<Category[]>([]);
	const [articles, setArticles] = React.useState<SavedArticle[]>([]);
	const [selectedSubCategory, setSelectedSubCategory] = React.useState("");
	const [keyword, setKeyword] = React.useState("");
	const [currentPage, setCurrentPage] = React.useState(1);
	const [loading, setLoading] = React.useState(true);
	const [errorMessage, setErrorMessage] = React.useState("");
	const [removingArticleId, setRemovingArticleId] = React.useState<
		string | null
	>(null);
	const [reloadKey, setReloadKey] = React.useState(0);
	const { showToast } = useToast();

	const filteredArticles = React.useMemo(() => {
		const normalizedKeyword = keyword.trim().toLowerCase();

		return articles.filter((article) => {
			const matchesCategory = selectedSubCategory
				? article.subCategoryId === Number(selectedSubCategory)
				: true;
			const matchesKeyword = normalizedKeyword
				? article.title.toLowerCase().includes(normalizedKeyword)
				: true;

			return matchesCategory && matchesKeyword;
		});
	}, [articles, keyword, selectedSubCategory]);

	const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE);
	const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
	const paginatedArticles = filteredArticles.slice(
		startIndex,
		startIndex + ITEMS_PER_PAGE,
	);

	const updatePageInUrl = (page: number) => {
		const params = new URLSearchParams(window.location.search);
		params.set("page", String(page));
		window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
	};

	React.useEffect(() => {
		const controller = new AbortController();
		const token = Cookies.get("token");
		const initialDataRequest = token
			? Promise.all([
					getSavedArticles(token, controller.signal),
					getArticleCategories(controller.signal),
				])
			: Promise.reject(new Error("請先登入才能查看文章收藏"));

		void initialDataRequest
			.then(([nextArticles, nextCategories]) => {
				setArticles(nextArticles);
				setCategories(nextCategories);

				const requestedPage = Number(
					new URLSearchParams(window.location.search).get("page"),
				);
				if (Number.isInteger(requestedPage) && requestedPage > 0) {
					const maxPage = Math.max(
						1,
						Math.ceil(nextArticles.length / ITEMS_PER_PAGE),
					);
					setCurrentPage(Math.min(requestedPage, maxPage));
				}
			})
			.catch((error: unknown) => {
				if (error instanceof DOMException && error.name === "AbortError") {
					return;
				}

				setErrorMessage(
					error instanceof Error ? error.message : "收藏文章載入失敗",
				);
			})
			.finally(() => {
				if (!controller.signal.aborted) setLoading(false);
			});

		return () => controller.abort();
	}, [reloadKey]);

	const resetToFirstPage = () => {
		setCurrentPage(1);
		updatePageInUrl(1);
	};

	const retryLoad = () => {
		setLoading(true);
		setErrorMessage("");
		setReloadKey((current) => current + 1);
	};

	const handleRemove = async (articleId: string) => {
		const token = Cookies.get("token");
		if (!token) {
			showToast("請先登入才能取消收藏");
			return;
		}

		setRemovingArticleId(articleId);
		try {
			const message = await removeSavedArticle(token, articleId);
			setArticles((currentArticles) =>
				currentArticles.filter((article) => article.id !== articleId),
			);

			const nextTotalPages = Math.max(
				1,
				Math.ceil((filteredArticles.length - 1) / ITEMS_PER_PAGE),
			);
			if (currentPage > nextTotalPages) {
				setCurrentPage(nextTotalPages);
				updatePageInUrl(nextTotalPages);
			}

			showToast(message);
		} catch (error) {
			showToast(error instanceof Error ? error.message : "取消收藏失敗");
		} finally {
			setRemovingArticleId(null);
		}
	};

	const returnTo = `${pathname}?page=${currentPage}`;

	return (
		<>
			<div className="relative min-h-screen overflow-hidden">
				<AmbientBackground />
				<div className="relative z-10 max-w-7xl mx-auto w-full py-4 px-2">
					<div className="relative z-10 border-5 border-black bg-[#FDFCF9]">
						<div
							className="pointer-events-none absolute inset-0 z-10 opacity-50"
							style={{
								backgroundImage: "url('/article/noise.png')",
								backgroundRepeat: "repeat",
								backgroundSize: "90px",
							}}
						/>

						<div className="relative z-20">
							<div className="flex flex-col md:flex-row items-stretch md:items-center w-full justify-between gap-3 p-3 bg-black">
								<div className="flex w-full min-w-0 flex-1 items-center">
									<Link
										href="/article"
										className="flex h-10 w-10 shrink-0 items-center justify-center bg-black text-white hover:bg-gray-800"
										aria-label="返回文章列表"
									>
										<House size={22} />
									</Link>
									<div className="w-full min-w-0">
										<Menubar className="flex h-auto min-w-0 overflow-x-auto whitespace-nowrap border-0 bg-black p-0 text-slate-100 md:h-10 md:flex-nowrap">
											<MenubarMenu>
												<MenubarTrigger
													onClick={() => {
														setSelectedSubCategory("");
														resetToFirstPage();
													}}
												>
													全部
												</MenubarTrigger>
											</MenubarMenu>
											<div className="mx-1 h-5 w-px self-center bg-gray-500" />

											{loading ? (
												<div className="self-center px-3 text-sm text-gray-400">
													載入中...
												</div>
											) : (
												categories.map((category, index) => (
													<React.Fragment key={category.category_name}>
														<MenubarMenu>
															<MenubarTrigger>
																{category.category_name}
															</MenubarTrigger>
															<MenubarContent>
																<MenubarRadioGroup
																	value={selectedSubCategory}
																	onValueChange={(value) => {
																		setSelectedSubCategory(value);
																		resetToFirstPage();
																	}}
																>
																	{category.sub_category.map((subCategory) => (
																		<MenubarRadioItem
																			key={subCategory.id}
																			value={String(subCategory.id)}
																		>
																			{subCategory.sub_category_name}
																		</MenubarRadioItem>
																	))}
																</MenubarRadioGroup>
															</MenubarContent>
														</MenubarMenu>
														{index < categories.length - 1 && (
															<div className="mx-1 h-5 w-px self-center bg-gray-500" />
														)}
													</React.Fragment>
												))
											)}
										</Menubar>
									</div>
								</div>

								<div className="w-full max-w-md border border-white lg:w-auto">
									<SearchBar
										onSearch={(nextKeyword) => {
											setKeyword(nextKeyword);
											resetToFirstPage();
										}}
									/>
								</div>
							</div>

							<div className="p-4">
								<div className="flex items-center justify-between gap-4">
									<Breadcrumb>
										<BreadcrumbList className="text-sm">
											<BreadcrumbItem>
												<BreadcrumbLink render={<Link href="/">首頁</Link>} />
											</BreadcrumbItem>
											<BreadcrumbSeparator />
											<BreadcrumbItem>
												<BreadcrumbPage>收藏文章</BreadcrumbPage>
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
								<div className="mt-4 border-b-2 border-black" />
							</div>

							<div className="p-4 md:p-6">
								{errorMessage ? (
									<div className="border-2 border-black bg-amber-50 p-6 text-center">
										<p className="text-sm font-medium text-red-700">
											{errorMessage}
										</p>
										<Button
											type="button"
											variant="outline"
											className="mt-4 border-black"
											onClick={retryLoad}
										>
											重新載入
										</Button>
									</div>
								) : loading ? (
									<p className="py-10 text-center text-gray-500">
										收藏文章載入中...
									</p>
								) : articles.length === 0 ? (
									<div className="py-10 text-center">
										<p className="text-gray-600">尚未收藏任何文章。</p>
										<Link
											href="/article"
											className="mt-4 inline-flex h-9 items-center border-2 border-black bg-[#FBDF58] px-4 text-sm font-bold shadow-[2px_2px_0px_0px_#000] hover:bg-yellow-300"
										>
											前往文章列表
										</Link>
									</div>
								) : paginatedArticles.length === 0 ? (
									<p className="py-10 text-center text-gray-600">
										沒有符合條件的收藏文章。
									</p>
								) : (
									<div className="flex flex-col">
										{paginatedArticles.map((article) => {
											const detailHref = getArticleDetailHref(
												article.id,
												returnTo,
											);
											const isRemoving = removingArticleId === article.id;

											return (
												<article
													key={article.id}
													className="flex gap-3 border-b-2 border-black py-4 first:-mt-3 sm:gap-4"
												>
													<Link
														href={detailHref}
														className="relative min-h-36 w-32 shrink-0 self-stretch sm:w-40 md:w-44"
													>
														<ArticleThumbnail
															content={article.content}
															title={article.title}
															width={176}
															height={132}
															className="absolute inset-0 h-full w-full border border-black bg-white object-cover"
														/>
													</Link>

													<div className="flex min-w-0 flex-1 flex-col gap-2">
														<div className="flex min-w-0 items-start justify-between gap-3">
															<h2 className="min-w-0 flex-1 line-clamp-2 font-bold text-lg leading-6 text-slate-900">
																{article.title}
															</h2>
															<time className="shrink-0 whitespace-nowrap pt-1 text-xs text-gray-700">
																{article.date}
															</time>
														</div>

														<p className="line-clamp-3 wrap-break-word overflow-hidden text-base leading-6 text-gray-600">
															{getArticleSummary(article.content)}
														</p>

														<div className="mt-auto flex items-center justify-between gap-3">
															<div className="hidden sm:flex min-w-0 items-center gap-1 text-xs text-gray-500 sm:text-sm">
																<FontAwesomeIcon
																	icon={faBookmark}
																	className=" sm:inline shrink-0"
																/>
																<span className=" sm:inline">
																	收藏於 {article.savedAt}
																</span>
															</div>

															<div className="flex shrink-0 items-center gap-2">
																<Button
																	type="button"
																	variant="outline"
																	size="sm"
																	disabled={removingArticleId !== null}
																	className="h-7 border-black px-3 text-xs text-red-700 hover:bg-white hover:text-black shadow-[2px_2px_0px_0px_#000]"
																	onClick={() => handleRemove(article.id)}
																>
																	{isRemoving ? "移除中..." : "取消收藏"}
																</Button>
																<Link href={detailHref}>
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
												</article>
											);
										})}
									</div>
								)}
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
