export interface SavedArticle {
	id: string;
	title: string;
	content: string;
	date: string;
	author: string;
	category: string;
	subCategoryId: number | null;
	savedAt: string;
}

interface SavedArticlesResponse {
	articles?: SavedArticle[];
	message?: string;
}

interface RemoveSavedArticleResponse {
	message?: string;
}

async function readResponse<T>(response: Response): Promise<T | null> {
	try {
		return (await response.json()) as T;
	} catch {
		return null;
	}
}

export async function getSavedArticles(
	token: string,
	signal?: AbortSignal,
): Promise<SavedArticle[]> {
	const response = await fetch("/api/article/saved-articles", {
		headers: { Authorization: `Bearer ${token}` },
		signal,
	});
	const data = await readResponse<SavedArticlesResponse>(response);

	if (!response.ok) {
		throw new Error(data?.message || "收藏文章載入失敗");
	}

	return Array.isArray(data?.articles) ? data.articles : [];
}

export async function removeSavedArticle(
	token: string,
	articleId: string,
): Promise<string> {
	const response = await fetch(`/api/article/saved-articles/${articleId}`, {
		method: "DELETE",
		headers: { Authorization: `Bearer ${token}` },
	});
	const data = await readResponse<RemoveSavedArticleResponse>(response);

	if (!response.ok) {
		throw new Error(data?.message || "取消收藏失敗");
	}

	return data?.message || "已取消收藏";
}
