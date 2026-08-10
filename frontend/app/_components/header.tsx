import Link from "next/link";

import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";

import HeaderLoginBtn from "./_components/headerLoginBtn";
import MobileNavSidebar from "./_components/mobileNavSidebar";
import CartBadge from "../shop/_components/CartBadge";

config.autoAddCss = false;

interface HeaderProps {
	token: boolean;
	className: string;
}

export default function Header({ token, className = "" }: HeaderProps) {
	return (
		<header
			className={`${className} sticky top-0 z-30 h-15 bg-page-red backdrop-blur text-white`}
		>
			<div className="max-w-7xl mx-auto h-full px-5 flex items-center justify-between">
				<Link
					href="/"
					className="font-black text-4xl hover:underline underline-offset-4 font-pixel"
				>
					Realicious
				</Link>
				<nav className="hidden md:flex items-center gap-x-2">
					<Link
						href="/article"
						className="px-4 py-3 font-medium hover:underline underline-offset-4"
					>
						文章
					</Link>
					<Link
						href="/shop"
						className="px-4 py-3 font-medium hover:underline underline-offset-4"
					>
						商城
					</Link>
					<Link
						href="/accounting"
						className="px-4 py-3 font-medium hover:underline underline-offset-4"
					>
						記帳小雞
					</Link>
				</nav>

				<div className="flex items-center">
					<MobileNavSidebar />
					<CartBadge />
					<HeaderLoginBtn token={token} />
				</div>
			</div>
		</header>
	);
}
