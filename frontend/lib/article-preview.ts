const FALLBACK_THUMBNAIL = "/article/chicken_happy.png";

const IMG_TAG_PATTERN = /<img\b[^>]*>/gi;
const SRC_ATTRIBUTE_PATTERN =
	/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i;

const decodeHtmlEntities = (value: string): string =>
	value
		.replace(/&amp;/gi, "&")
		.replace(/&nbsp;/gi, " ")
		.replace(/&quot;/gi, '"')
		.replace(/&#(?:0*39|x0*27);/gi, "'")
		.replace(/&lt;/gi, "<")
		.replace(/&gt;/gi, ">");

const isSafeImageSource = (source: string): boolean => {
	if (source.startsWith("/") && !source.startsWith("//")) {
		return true;
	}

	try {
		const url = new URL(source);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
};

export const getArticleThumbnailSrc = (html: string): string => {
	for (const tagMatch of html.matchAll(IMG_TAG_PATTERN)) {
		const sourceMatch = tagMatch[0].match(SRC_ATTRIBUTE_PATTERN);
		const rawSource =
			sourceMatch?.[1] ?? sourceMatch?.[2] ?? sourceMatch?.[3] ?? "";
		const source = decodeHtmlEntities(rawSource.trim());

		if (isSafeImageSource(source)) {
			return source;
		}
	}

	return FALLBACK_THUMBNAIL;
};

export const getArticleSummary = (html: string): string =>
	decodeHtmlEntities(
		html
			.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
			.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
			.replace(/<[^>]+>/g, " "),
	)
		.replace(/\s+/g, " ")
		.trim();

export { FALLBACK_THUMBNAIL };
