"use client";
import React, { useSyncExternalStore } from "react";
import Link from "next/link";
import { ShoppingBasket } from "lucide-react";
import { getCartItems } from "@/lib/shop/cart";

function subscribe(callback: () => void) {
	window.addEventListener("cart-updated", callback);
	return () => window.removeEventListener("cart-updated", callback);
}

function getSnapshot() {
	return getCartItems().reduce((sum, item) => sum + item.qty, 0);
}

function getServerSnapshot() {
	return 0;
}

export default function CartBadge() {
	const count = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

	return (
		<Link href="/shop/cart" title="購物車" className="relative m-3">
			<ShoppingBasket className="h-6.25 w-7 cursor-pointer" />
			{count > 0 && (
				<span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center">
					{count > 99 ? "99+" : count}
				</span>
			)}
		</Link>
	);
}
