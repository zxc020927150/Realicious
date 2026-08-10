"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Breadcrumbs from "./_components/Breadcrumbs";
import Sort from "./_components/ProductSort";
import Searchbar from "./_components/Searchbar";
import CategoryFilter from "./_components/CategoryFilter";
import FeaturedProductSection from "./_components/FeaturedProductSection";
import ProductCard from "./_components/ProductCard";
import { getProducts, type Product } from "@/lib/shop/product";
import { getFavorites } from "@/lib/shop/favorites";
import { useUser } from "@/app/context/user";

const PRICE_MAX = 5000;

const QUICK_FILTER_TERMS: Record<string, string[]> = {
  hotpot: ["鍋"],
  fried: ["炸雞", "炸豬", "雞排"],
  burger: ["堡"],
  pizza: ["比薩"],
  dumplings: ["七方"],
  buffet: ["饗食"],
};

function matchesQuickFilter(product: Product, filterKey: string) {
  if (!filterKey) return true;
  return (QUICK_FILTER_TERMS[filterKey] || []).some((term) => product.name.includes(term));
}

export default function ShopPage() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [favoriteProductIds, setFavoriteProductIds] = useState<number[]>([]);
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "")
  const [tagKeyword, setTagKeyword] = useState("")
  const [sortId, setSortId] = useState("")
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX)
  const priceMax = PRICE_MAX;
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null);

  const sortedProducts = useMemo(() => {
    let list = [...filteredProducts].filter(
      (p) => p.price >= minPrice && p.price <= maxPrice
    );
    if (tagKeyword) list = list.filter((p) => matchesQuickFilter(p, tagKeyword));
    if (sortId === "price_low") list.sort((a, b) => a.price - b.price);
    if (sortId === "price_high") list.sort((a, b) => b.price - a.price);
    return list;
  }, [filteredProducts, sortId, minPrice, maxPrice, tagKeyword]);

  useEffect(() => {
    getProducts().then((res) => {
      if (res.success) {
        setAllProducts(res.data);
      }
    });
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    getFavorites(Number(user.id)).then((res) => {
      if (res.success) setFavoriteProductIds(res.data.map((f: { product_id: number }) => f.product_id));
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

  useEffect(() => {
    getProducts({ keyword, page: 1 }).then((res) => {
      if (res.success) {
        setPage(1);
        setHasMore(true);
        setFilteredProducts(res.data);
        if (res.pagination && 1 >= res.pagination.totalPages) setHasMore(false);
      }
    });
  }, [keyword]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    getProducts({ keyword, page: nextPage }).then((res) => {
      if (res.success) {
        setFilteredProducts((prev) => [...prev, ...res.data]);
        setPage(nextPage);
        if (res.pagination && nextPage >= res.pagination.totalPages) setHasMore(false);
      }
      setLoadingMore(false);
    });
  }, [page, hasMore, loadingMore, keyword]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="relative min-h-screen px-3 py-4 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* 頂層：麵包屑 + 搜尋 + 排序 + 篩選 */}
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="hidden shrink-0 lg:block">
            <Breadcrumbs items={[{ label: "首頁", href: "/" }, { label: "商品列表" }]} />
          </div>
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
            <Searchbar value={keyword} onSearch={(kw) => setKeyword(kw)} />
            <Sort value={sortId} onSort={setSortId} />
          </div>
        </div>

        {/* 標籤 + 價格列 */}
        <div className="mb-4">
          <CategoryFilter
            activeKeyword={tagKeyword}
            minPrice={minPrice}
            maxPrice={maxPrice}
            priceMax={priceMax}
            onTagChange={(kw) => setTagKeyword(kw)}
            onPriceChange={(min, max) => { setMinPrice(min); setMaxPrice(max); }}
            onReset={() => {
              setTagKeyword("");
              setKeyword("");
              setSortId("");
              setMinPrice(0);
              setMaxPrice(PRICE_MAX);
            }}
          />
        </div>

        {/* 推薦商品區塊 */}
        <div className="w-full mb-4">
          {allProducts.length > 0 && (
            <FeaturedProductSection
              products={allProducts}
              favoritedProductIds={user?.id ? favoriteProductIds : []}
              onFavoriteChange={handleFavoriteChange}
            />
          )}
        </div>

        {/* 商品網格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 xl:gap-8">
          {sortedProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              favoritedProductIds={user?.id ? favoriteProductIds : []}
              onFavoriteChange={handleFavoriteChange}
            />
          ))}
        </div>

        {/* 無限滾動哨兵 + 載入中 */}
        <div ref={sentinelRef} className="h-10" />
        {loadingMore && (
          <div className="text-center py-4 text-[#3D2419] font-bold">載入更多商品...</div>
        )}
        {!hasMore && filteredProducts.length > 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">已顯示全部商品</div>
        )}
      </div>
    </div>
  );
}
