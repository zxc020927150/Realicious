"use client";
import React, { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import Link from "next/link";
import Container from "../../_components/container";
import Left from "../_components/left";
import { getFavorites, removeFavorite, type Favorite } from "@/lib/shop/favorites";
import { useUser } from "@/app/context/user";
import PageHeader from "@/app/_components/PageHeader";
import { useToast } from "@/app/shop/_components/Toast";
import ConfirmRemoveFavoriteDialog from "@/app/shop/_components/ConfirmRemoveFavoriteDialog";
import AccountEmptyState from "@/app/shop/_components/AccountEmptyState";
import "@/app/shop/shop-theme.css";

export default function AccountFavorites() {
  const { user } = useUser();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [pendingRemoval, setPendingRemoval] = useState<Favorite | null>(null);
  const { showToast } = useToast();

  const fetchFavorites = () => {
    if (!user?.id) return;
    getFavorites(Number(user.id)).then((res) => {
      if (res.success) setFavorites(res.data);
    });
  };

  useEffect(() => {
    fetchFavorites();
  }, [user?.id]);

  const handleRemove = async (productId: number) => {
    if (!user?.id) return;
    const result = await removeFavorite(Number(user.id), productId);
    if (result.success) {
      showToast("已從收藏移除商品");
      setPendingRemoval(null);
      fetchFavorites();
    }
  };

  return (
    <Container className="shop-theme min-h-[calc(100dvh-5rem)] flex-col items-stretch overflow-visible bg-white md:flex-row md:overflow-hidden">
      {pendingRemoval && (
        <ConfirmRemoveFavoriteDialog
          productName={pendingRemoval.product_name}
          onCancel={() => setPendingRemoval(null)}
          onConfirm={() => handleRemove(pendingRemoval.product_id)}
        />
      )}
      <Left />
      <div className="no-scrollbar w-full min-w-0 px-4 pb-28 pt-4 md:h-[720px] md:flex-1 md:overflow-y-auto md:pb-4">
        <PageHeader icon={<Heart className="h-5 w-5" />} title="商品收藏" />

        {favorites.length === 0 ? (
          <AccountEmptyState
            icon={<Heart className="size-6" />}
            title="尚未收藏任何商品"
            description="看到喜歡的餐券時，點擊愛心即可收藏，之後可以從這裡快速找到。"
            actionHref="/shop"
            actionLabel="前往商城逛逛"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((fav) => (
              <div key={fav.id} className="relative border-[3px] border-[#3D2419] shadow-[3px_3px_0px_0px_#3D2419] bg-white overflow-hidden group">
                <Link href={`/shop/products/${fav.product_id}`} className="block h-40 overflow-hidden">
                  {fav.product_img && (
                    <img
                      src={`http://localhost:3001${fav.product_img}`}
                      alt={fav.product_name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </Link>
                <div className="p-3">
                  <p className="font-bold text-sm text-[#3D2419] truncate">{fav.product_name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-black text-[#8C5230]">${fav.product_price}</span>
                    <button
                      onClick={() => setPendingRemoval(fav)}
                      className="px-2.5 py-1 text-xs font-bold text-white bg-[#BB0015] border-2 border-[#3D2419] shadow-[2px_2px_0px_0px_#3D2419] hover:bg-[#8E0010] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                    >
                      移除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
