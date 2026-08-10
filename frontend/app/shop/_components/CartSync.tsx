"use client";

import { useEffect } from "react";
import { useUser } from "@/app/context/user";
import { switchToGuestCart, syncCartForUser } from "@/lib/shop/cart";

export default function CartSync() {
  const { user, loading } = useUser();

  useEffect(() => {
    if (loading) return;
    if (user?.id) {
      void syncCartForUser(Number(user.id));
      return;
    }
    switchToGuestCart();
  }, [loading, user?.id]);

  return null;
}
