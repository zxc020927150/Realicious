"use client";

import {
	FALLBACK_THUMBNAIL,
	getArticleThumbnailSrc,
} from "@/lib/article-preview";

interface ArticleThumbnailProps {
	content: string;
	title: string;
	className?: string;
	height?: number;
	loading?: "eager" | "lazy";
	width?: number;
}

export default function ArticleThumbnail({
	content,
	title,
	className = "h-[84px] w-28 border border-black bg-white object-cover",
	height = 84,
	loading = "lazy",
	width = 112,
}: ArticleThumbnailProps) {
	const source = getArticleThumbnailSrc(content);

	return (
		// User-provided external image domains are intentionally rendered without Next Image optimization.
		// eslint-disable-next-line @next/next/no-img-element
		<img
			key={source}
			src={source}
			alt={`${title}的文章縮圖`}
			width={width}
			height={height}
			loading={loading}
			className={className}
			onError={({ currentTarget }) => {
				if (currentTarget.getAttribute("src") === FALLBACK_THUMBNAIL) {
					return;
				}
				currentTarget.src = FALLBACK_THUMBNAIL;
			}}
		/>
	);
}
