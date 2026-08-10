"use client";

import Image from "next/image";
import Link from "next/link";

export default function Hero() {
	return (
		<section className="relative overflow-hidden bg-page-red">
			<div className="relative flex h-190 w-full items-center md:h-190">
				{/* 內容 */}
				<div className="relative z-20 mx-auto flex h-full w-full max-w-7xl items-center px-5">
					<div className="hero-copy flex h-full w-full flex-col justify-center md:w-1/2 lg:w-5/12">
						{/* 上半部 */}
						<div className="hero-title">
							<p className="font-pixel mb-4 text-sm font-bold tracking-[0.30em] text-yellow-300 md:text-xl">
								REALICIOUS
							</p>

							<h1 className="font-pixel text-4xl font-black leading-tight text-white md:text-5xl lg:text-6xl">
								Taste More.
								<br />
								Spend Less.
							</h1>
						</div>

						{/* 下半部 */}
						<div className="hero-bottom mt-8">
							<p className="text-base leading-9 text-white/90 md:text-lg lg:text-xl">
								美食交流、優惠探索，
								<br />
								讓記帳小雞陪你記錄每一餐。
							</p>

							<div className="mt-10 flex flex-wrap gap-3 md:gap-5">
								<Link
									href="/article"
									className="border-2 border-black bg-white px-6 py-3 text-sm font-bold text-page-red shadow-[4px_4px_0px_0px_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] md:px-8 md:py-4 md:text-base"
								>
									開始探索
								</Link>

								<Link
									href="/shop"
									className="border-2 border-black bg-yellow-300 px-6 py-3 text-sm font-bold text-black shadow-[4px_4px_0px_0px_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] md:px-8 md:py-4 md:text-base"
								>
									前往商城
								</Link>
							</div>
						</div>
					</div>
				</div>

				{/* Orbit */}
				<div className="pointer-events-none absolute inset-0 overflow-hidden">
					<div className="orbit">
						<div className="orbit-inner">
							<div className="plate plate-1">
								<div className="plate-content">
									<Image
										src="/article/Salad.jpg"
										alt=""
										fill
										priority
										className="object-cover"
										sizes="(max-width:1024px) 320px,600px"
									/>
								</div>
							</div>

							<div className="plate plate-2">
								<div className="plate-content">
									<Image
										src="/article/PorkRice.png"
										alt=""
										fill
										priority
										className="object-cover"
										sizes="(max-width:1024px) 320px,600px"
									/>
								</div>
							</div>

							<div className="plate plate-3">
								<div className="plate-content">
									<Image
										src="/article/pizza.jpg"
										alt=""
										fill
										priority
										className="object-cover"
										sizes="(max-width:1024px) 320px,600px"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
