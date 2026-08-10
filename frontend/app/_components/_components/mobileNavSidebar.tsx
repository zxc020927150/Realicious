"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { FaBars, FaXmark } from "react-icons/fa6";

const emptySubscribe = () => () => {};

// 手機版導覽：按漢堡按鈕後，從右側滑出選單。
export default function MobileNavSidebar() {
	const [isOpen, setIsOpen] = useState(false);
	// document 只存在瀏覽器，所以只在 client 端建立 Portal。
	const isMounted = useSyncExternalStore(
		emptySubscribe,
		() => true,
		() => false,
	);

	const closeSidebar = () => setIsOpen(false);

	return (
		<>
			<button
				type="button"
				onClick={() => setIsOpen(true)}
				className="p-2 text-white hover:cursor-pointer md:hidden"
				aria-label="開啟主選單"
				aria-expanded={isOpen}
			>
				<FaBars className="text-xl" />
			</button>

			{isMounted &&
				createPortal(
					<>
						<div
							className={`fixed top-0 right-0 z-50 h-full w-80 bg-[#FCF9F6] text-black shadow-2xl transition-transform duration-300 ease-in-out ${
								isOpen ? "translate-x-0" : "translate-x-full"
							}`}
							aria-hidden={!isOpen}
						>
							<div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
								<p className="text-lg font-black">選單</p>
								<button
									type="button"
									onClick={closeSidebar}
									className="p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-black"
									aria-label="關閉主選單"
								>
									<FaXmark className="text-2xl" />
								</button>
							</div>

							<nav aria-label="手機版主選單" className="py-2">
								<Link
									href="/article"
									onClick={closeSidebar}
									className="flex h-13 items-center px-8 font-medium hover:bg-[#FBDF58]"
								>
									文章
								</Link>
								<Link
									href="/shop"
									onClick={closeSidebar}
									className="flex h-13 items-center px-8 font-medium hover:bg-[#FBDF58]"
								>
									商城
								</Link>
								<Link
									href="/accounting"
									onClick={closeSidebar}
									className="flex h-13 items-center px-8 font-medium hover:bg-[#FBDF58]"
								>
									記帳小雞
								</Link>
							</nav>
						</div>

						<button
							type="button"
							onClick={closeSidebar}
							className={`fixed inset-0 z-40 bg-black/40 ${isOpen ? "" : "hidden"}`}
							aria-label="關閉主選單遮罩"
						/>
					</>,
					document.body,
				)}
		</>
	);
}
