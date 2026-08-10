"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
	onPageChange?: (page: number) => void;
}

export default function Pagination({
	currentPage,
	totalPages,
	setCurrentPage,
	onPageChange,
}: PaginationProps) {
	if (totalPages <= 1) return null;

	const goToPage = (page: number) => {
		setCurrentPage(page);
		onPageChange?.(page);
	};

	return (
		<nav aria-label="Pagination" className="inline-flex shadow-xs">
			<button
				onClick={() => currentPage > 1 && goToPage(currentPage - 1)}
				disabled={currentPage === 1}
				className="relative inline-flex cursor-pointer items-center px-2 py-2 bg-page-red text-white border border-black hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<span className="sr-only">Previous</span>
				<ChevronLeftIcon className="size-5" />
			</button>

			{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
				<button
					key={page}
					onClick={() => goToPage(page)}
					aria-current={page === currentPage ? "page" : undefined}
					className={`relative inline-flex cursor-pointer items-center px-4 py-2 text-sm font-semibold border ${
						page === currentPage
							? "bg-page-red text-white border-black"
							: "text-gray-900 border-gray-300 hover:bg-gray-50"
					}`}
				>
					{page}
				</button>
			))}

			<button
				onClick={() => currentPage < totalPages && goToPage(currentPage + 1)}
				disabled={currentPage === totalPages}
				className="relative inline-flex cursor-pointer items-center px-2 py-2 bg-page-red text-white border border-black hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<span className="sr-only">Next</span>
				<ChevronRightIcon className="size-5" />
			</button>
		</nav>
	);
}
