"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProducts, type Product } from "@/lib/shop/product";

const API_BASE = "http://localhost:3001";
const FALLBACK_IMAGE = `${API_BASE}/images/optimized/吃到飽.webp`;

export default function ProductSection() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;

    getProducts().then((result) => {
      if (!cancelled && result.success) {
        setProducts(result.data.slice(0, 4));
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
          <div>
            <p className="text-[#BB0015] font-bold">OUR PICKS</p>
            <h2 className="text-4xl font-bold mt-2">精選商品</h2>
          </div>
          <Link
            href="/shop"
            className="font-bold text-[#BB0015] border-b-2 border-[#BB0015] hover:text-[#8E0010] hover:border-[#8E0010]"
          >
            前往商城 →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
          {products.length === 0
            ? Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="overflow-hidden bg-white shadow animate-pulse">
                  <div className="aspect-16/10 bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 w-3/4 bg-gray-200" />
                    <div className="h-4 w-1/2 bg-gray-100" />
                    <div className="h-7 w-1/3 bg-gray-200" />
                  </div>
                </div>
              ))
            : products.map((product) => (
                <Link
                  key={product.id}
                  href={`/shop/products/${product.id}`}
                  className="group overflow-hidden bg-white shadow hover:shadow-xl hover:-translate-y-2 transition-all"
                >
                  <div className="aspect-16/10 overflow-hidden bg-gray-100">
                    <img
                      src={product.main_img ? `${API_BASE}${product.main_img}` : FALLBACK_IMAGE}
                      alt={product.name}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = FALLBACK_IMAGE;
                      }}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  <div className="p-5 space-y-3">
                    <p className="text-sm text-slate-500">{product.category_name || "精選餐券"}</p>
                    <h3 className="font-bold text-lg text-slate-900 line-clamp-2">{product.name}</h3>
                    <span className="block text-[#BB0015] text-2xl font-black">${product.price}</span>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}
