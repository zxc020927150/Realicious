"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
	onSearch: (keyword: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
	const [keyword, setKeyword] = useState("");

	return (
		<Field orientation="horizontal" className="w-full max-w-none min-w-0 gap-0">
			<Input
				type="search"
				placeholder="搜尋文章..."
				value={keyword}
				onChange={(e) => setKeyword(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						onSearch(keyword);
					}
				}}
				className="flex-1 border-b-gray-500 bg-gray-200 pl-2"
			/>

			<Button
				type="button"
				className="border-0 text-sm"
				onClick={() => {
					console.log("clicked");
					onSearch(keyword);
				}}
			>
				搜尋
			</Button>
		</Field>
	);
}
