"use client";

import React, { useCallback, useEffect, useState } from "react";
import ProductCard from "@/app/shop/_components/ProductCard";
import { getFavorites } from "@/lib/shop/favorites";
import { getProducts, type Product } from "@/lib/shop/product";
import { useUser } from "@/app/context/user";

export default function RelatedProducts({ product }: { product: Product }) {
  const { user } = useUser();
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [favoriteProductIds, setFavoriteProductIds] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getProducts({ category_id: String(product.category_id) }),
      getProducts(),
    ]).then(([sameCategoryResult, allProductsResult]) => {
      if (cancelled) return;

      const candidates = [
        ...(sameCategoryResult.success ? sameCategoryResult.data : []),
        ...(allProductsResult.success ? allProductsResult.data : []),
      ].filter((item: Product) => item.id !== product.id);

      const uniqueCandidates = Array.from(
        new Map(candidates.map((item: Product) => [item.id, item])).values(),
      );
      setRelatedProducts(uniqueCandidates.slice(0, 3));
    });

    return () => {
      cancelled = true;
    };
  }, [product.id, product.category_id]);

  useEffect(() => {
    if (!user?.id) return;
    getFavorites(Number(user.id)).then((result) => {
      if (result.success) {
        setFavoriteProductIds(result.data.map((favorite: { product_id: number }) => favorite.product_id));
      }
    });
  }, [user?.id]);

  const handleFavoriteChange = useCallback((productId: number, isFavorited: boolean) => {
    setFavoriteProductIds((previousIds) => {
      if (isFavorited) {
        return previousIds.includes(productId) ? previousIds : [...previousIds, productId];
      }
      return previousIds.filter((id) => id !== productId);
    });
  }, []);

  if (relatedProducts.length === 0) return null;

  return (
    <section className="mt-16 border-t-[3px] border-[#3D2419] pt-10">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-sm font-bold text-[#8C5230] mb-1">同類餐券精選</p>
          <h3 className="text-2xl font-black text-[#3D2419] tracking-wide">你可能也喜歡</h3>
        </div>
        <span className="text-sm font-medium text-[#3D2419]/60">看看其他值得收藏的美味選擇</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {relatedProducts.map((relatedProduct) => (
          <ProductCard
            key={relatedProduct.id}
            product={relatedProduct}
            favoritedProductIds={user?.id ? favoriteProductIds : []}
            onFavoriteChange={handleFavoriteChange}
          />
        ))}
      </div>
    </section>
  );
}
