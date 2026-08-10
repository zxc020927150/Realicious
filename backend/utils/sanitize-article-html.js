import sanitizeHtml from "sanitize-html";

const colorPattern = /^(#[0-9a-f]{3,8}|rgb\([\d.]+(?:\s*,\s*[\d.]+){2}\)|rgba\([\d.]+(?:\s*,\s*[\d.]+){3}\)|hsl\([\d.]+(?:\s*,\s*[\d.]+%){2}\)|hsla\([\d.]+(?:\s*,\s*[\d.]+%){3}\))$/i;

export const sanitizeArticleHtml = (html) =>
	sanitizeHtml(html, {
		allowedTags: [
			"p",
			"br",
			"strong",
			"b",
			"em",
			"i",
			"u",
			"s",
			"del",
			"sub",
			"sup",
			"span",
			"a",
			"h1",
			"h2",
			"h3",
			"ul",
			"ol",
			"li",
			"blockquote",
			"code",
			"pre",
			"figure",
			"img",
			"figcaption",
			"table",
			"thead",
			"tbody",
			"tr",
			"th",
			"td",
		],
		allowedAttributes: {
			a: ["href", "target", "rel"],
			figure: ["class", "style"],
			span: ["class", "style"],
			img: ["src", "alt", "width", "height", "class", "style"],
			"*": ["style"],
		},
		allowedClasses: {
			figure: ["image", "image_resized", /^image-style-[a-z0-9-]+$/i],
			span: ["image-inline", "image_resized", /^image-style-[a-z0-9-]+$/i],
			img: ["image_resized"],
		},
		allowedSchemes: ["http", "https", "mailto"],
		allowedSchemesByTag: {
			img: ["http", "https"],
		},
		allowProtocolRelative: false,
		allowedStyles: {
			"*": {
				"text-align": [/^(left|right|center|justify)$/],
				color: [colorPattern],
				"background-color": [colorPattern],
				"font-size": [/^\d+(?:\.\d+)?(?:px|em|rem|%)$/],
				width: [/^\d+(?:\.\d+)?%$/],
				"aspect-ratio": [/^\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?$/],
			},
		},
		transformTags: {
			a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
		},
	});
