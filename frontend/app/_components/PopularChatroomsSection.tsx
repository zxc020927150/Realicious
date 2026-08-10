"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_URL = `${BASE_URL}/user/api`;

const FALLBACK_IMAGE = `/user/chatroom/apple.png`; // 設定聊天室預設預覽圖

export interface PopularRoom {
	id: number;
	name: string;
	type: "PUBLIC_GROUP" | "PRIVATE_GROUP";
	imageUrl?: string;
	favoriteCount: number; // 收藏數
	_count?: {
		members: number; // 成員人數
	};
}

export default function PopularChatroomsSection() {
	const [rooms, setRooms] = useState<PopularRoom[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		// 呼叫後端 API 取得熱門聊天室（依收藏數排序）
		const fetchPopularRooms = async () => {
			try {
				const res = await fetch(`${API_URL}/chatrooms/popular?limit=4`);
				const result = await res.json();

				if (!cancelled && result.success) {
					setRooms(result.data);
				}
			} catch (err) {
				console.error("無法載入熱門聊天室:", err);
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		fetchPopularRooms();

		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<section className="py-12">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Section Header */}
				<div className="flex flex-wrap items-end justify-between gap-4 mb-12">
					<div>
						<p className="text-[#BB0015] font-bold tracking-wider">
							POPULAR ROOMS
						</p>
						<h2 className="text-4xl font-bold mt-2 text-slate-900">
							熱門聊天室
						</h2>
					</div>
					<Link
						href="/user/chatroom"
						className="font-bold text-[#BB0015] border-b-2 border-[#BB0015] hover:text-[#8E0010] hover:border-[#8E0010] transition-colors"
					>
						探索更多聊天室 →
					</Link>
				</div>

				{/* Card Grid */}
				<div className="grid grid-cols-2 gap-4 sm:gap-8 xl:grid-cols-4">
					{loading || rooms.length === 0
						? // Skeleton 載入骨架屏
							Array.from({ length: 4 }).map((_, index) => (
								<div
									key={index}
									className="overflow-hidden bg-white shadow animate-pulse rounded-lg"
								>
									<div className="aspect-16/10 bg-gray-200" />
									<div className="p-5 space-y-3">
										<div className="h-4 w-1/3 bg-gray-200 rounded" />
										<div className="h-6 w-3/4 bg-gray-200 rounded" />
										<div className="h-5 w-1/2 bg-gray-100 rounded" />
									</div>
								</div>
							))
						: // 熱門聊天室列表
							rooms.map((room) => (
								<Link
									key={room.id}
									href={`/user/chatroom?roomId=${room.id}`}
									className="group overflow-hidden bg-white shadow hover:shadow-xl hover:-translate-y-2 transition-all rounded-lg flex flex-col justify-between"
								>
									<div>
										{/* 聊天室封面圖片 */}
										<div className="aspect-16/10 overflow-hidden bg-gray-100 relative">
											<img
												src={room.imageUrl ? room.imageUrl : FALLBACK_IMAGE}
												alt={room.name}
												onError={(event) => {
													event.currentTarget.onerror = null;
													event.currentTarget.src = FALLBACK_IMAGE;
												}}
												className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
											/>
											{/* 標籤：公開/不公開 */}
											{/* <span className="absolute top-3 left-3 bg-slate-900/80 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
                        {room.type === "PUBLIC_GROUP" ? "公開群組" : "私密群組"}
                      </span> */}
										</div>

										{/* 卡片內容 */}
										<div className="p-5 space-y-3">
											<p className="text-sm text-slate-500 font-medium">
												聊天室 #{room.id}
											</p>
											<h3 className="font-bold sm:text-lg text-slate-900 line-clamp-2 group-hover:text-[#BB0015] transition-colors">
												{room.name}
											</h3>
										</div>
									</div>

									{/* 底部數據：收藏數 & 成員數 */}
									<div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-slate-100 text-sm text-slate-600">
										<div className="flex items-center gap-1">
											<span className="text-[#BB0015] font-black text-lg flex items-center justify-center">
												❤️ {room.favoriteCount || 0}
											</span>
											<span className="flex items-center justify-center text-xs text-slate-400 ml-0.5">
												人收藏
											</span>
										</div>

										<div className="flex items-center gap-1 text-slate-500 font-medium">
											{/* <span>👥 {room._count?.members || 0} 人</span> */}
										</div>
									</div>
								</Link>
							))}
				</div>
			</div>
		</section>
	);
}
