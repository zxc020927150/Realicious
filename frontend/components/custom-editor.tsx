"use client"; // Required only in App Router.

import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
	ClassicEditor,
	SimpleUploadAdapter,
	Autosave,
	Bold,
	Essentials,
	Italic,
	Mention,
	Paragraph,
	Undo,
	Heading,
	FontSize,
	Underline,
	Strikethrough,
	Link,
	List,
	BlockQuote,
	FontColor,
	FontBackgroundColor,
	Subscript,
	Alignment,
	TodoList,
	Indent,
	Code,
	CodeBlock,
	Image,
	ImageCaption,
	ImageStyle,
	ImageToolbar,
	ImageResize,
	ImageUpload,
	ImageInsert,
	AutoImage,
	Table,
	TableToolbar,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";

export default function CustomEditor({
	value = "",
	onChange,
}: {
	value?: string;
	onChange: (html: string) => void;
}) {
	return (
		<CKEditor
			editor={ClassicEditor}
			data={value}
			config={{
				language: "zh-tw",
				licenseKey: "GPL",
				simpleUpload: {
					uploadUrl: `/api/article/uploads/article-images`,
				},
				heading: {
					options: [
						{
							model: "paragraph",
							title: "Paragraph",
							class: "ck-heading_paragraph",
						},
						{
							model: "heading1",
							view: "h1",
							title: "Heading 1",
							class: "ck-heading_heading1",
						},
						{
							model: "heading2",
							view: "h2",
							title: "Heading 2",
							class: "ck-heading_heading2",
						},
						{
							model: "heading3",
							view: "h3",
							title: "Heading 3",
							class: "ck-heading_heading3",
						},
					],
				},
				link: {
					addTargetToExternalLinks: true,
					defaultProtocol: "https://",
				},
				image: {
					toolbar: [
						"imageStyle:inline",
						"imageStyle:block",
						"imageStyle:side",
						"|",
						"toggleImageCaption",
						"imageTextAlternative",
					],
				},
				toolbar: {
					shouldNotGroupWhenFull: true,
					items: [
						"heading",
						"|",
						"fontSize",
						"bold",
						"italic",
						"underline",
						"strikethrough",
						"link",
						"blockQuote",
						"fontColor",
						"fontBackgroundColor",
						"subscript",
						"bulletedList",
						"numberedList",
						"alignment",
						"todoList",
						"outdent",
						"indent",
						"code",
						"codeBlock",
						"insertTable",
						"insertImage",
						"undo",
						"redo",
					],
				},
				plugins: [
					List,
					SimpleUploadAdapter,
					Autosave,
					Bold,
					Essentials,
					Italic,
					Mention,
					Paragraph,
					Undo,
					Heading,
					FontSize,
					Underline,
					Strikethrough,
					Link,
					BlockQuote,
					FontColor,
					FontBackgroundColor,
					Subscript,
					Alignment,
					TodoList,
					Indent,
					Code,
					CodeBlock,
					Table,
					TableToolbar,
					Image,
					ImageCaption,
					ImageStyle,
					ImageToolbar,
					ImageUpload,
					ImageInsert,
					AutoImage,
					ImageResize,
				],
			}}
			onChange={(_, editor) => onChange(editor.getData())}
		/>
	);
}
