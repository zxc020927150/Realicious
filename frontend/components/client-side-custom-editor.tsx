// components/client-side-custom-editor.js
"use client"; // Required only in App Router.
import dynamic from "next/dynamic";
import React from "react";

// 動態載入真正的 CustomEditor
const CustomEditor = dynamic(() => import("@/components/custom-editor"), {
	ssr: false,
});

interface ClientSideCustomEditorProps {
	value?: string;
	onChange: (html: string) => void;
}

export default function ClientSideCustomEditor({
	value = "",
	onChange,
}: ClientSideCustomEditorProps) {
	return <CustomEditor value={value} onChange={onChange} />;
}
