"use client";
import React, { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import Link from "next/link";
import { getFavorites, removeFavorite, type Favorite } from "@/lib/shop/favorites";
import { useUser } from "@/app/context/user";
import PageHeader from "@/app/_components/PageHeader";
import { useToast } from "@/app/shop/_components/Toast";
import ConfirmRemoveFavoriteDialog from "@/app/shop/_components/ConfirmRemoveFavoriteDialog";

export default function ShopFavorites() {
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
    <div className="relative min-h-screen p-4">
      {pendingRemoval && (
        <ConfirmRemoveFavoriteDialog
          productName={pendingRemoval.product_name}
          onCancel={() => setPendingRemoval(null)}
          onConfirm={() => handleRemove(pendingRemoval.product_id)}
        />
      )}
      <div className="max-w-7xl mx-auto">
        <PageHeader icon={<Heart className="h-5 w-5" />} title="我的收藏" />

        {favorites.length === 0 ? (
          <p className="text-center py-10 text-gray-500">尚未收藏任何商品</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
                      className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
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
    </div>
  );
}
