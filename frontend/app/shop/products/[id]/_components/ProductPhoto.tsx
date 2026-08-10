"use client";

import React, { useMemo, useState } from "react";
import type { ProductImage } from "@/lib/shop/product";

const API_BASE = "http://localhost:3001";
const EMPTY_IMAGES: ProductImage[] = [];

// 商品副圖尚未完整建立前，先以商城已上傳的 Demo 食物圖補足縮圖互動。
const DEMO_IMAGES = [
  "/images/optimized/養生鍋.webp",
  "/images/optimized/炸雞桶.webp",
  "/images/optimized/煎餃.webp",
  "/images/optimized/雙層漢堡.webp",
  "/images/optimized/比薩1.webp",
];

function toImageUrl(path: string) {
  return path.startsWith("http") ? path : `${API_BASE}${path}`;
}

type ProductPhotoProps = {
  mainImage?: string;
  images?: ProductImage[];
  productName: string;
};

export default function ProductPhoto({ mainImage, images = EMPTY_IMAGES, productName }: ProductPhotoProps) {
  const photoPaths = useMemo(() => {
    const productImages = [...images]
      .sort((a, b) => Number(b.is_main) - Number(a.is_main))
      .map((image) => image.url);
    const paths = [mainImage, ...productImages, ...DEMO_IMAGES].filter(
      (path): path is string => Boolean(path)
    );
    return [...new Set(paths)].slice(0, 5);
  }, [images, mainImage]);
  const [selectedImage, setSelectedImage] = useState(photoPaths[0]);
  const [isLoading, setIsLoading] = useState(true);

  if (!selectedImage) return null;

  return (
    <div className="flex flex-col-reverse sm:flex-row w-full gap-3">
      <div className="flex flex-row sm:flex-col w-full sm:w-20 gap-3 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0">
        {photoPaths.map((path, index) => (
          <button
            key={path}
            type="button"
            aria-label={`查看商品圖片 ${index + 1}`}
            onClick={() => {
              setSelectedImage(path);
              setIsLoading(true);
            }}
            className={`h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden border-[3px] border-[#3D2419] shadow-[3px_3px_0px_0px_#3D2419] cursor-pointer transition-transform hover:translate-x-[1px] hover:translate-y-[1px] ${
              selectedImage === path ? "ring-4 ring-[#FBDF58]" : ""
            }`}
          >
            <img src={toImageUrl(path)} alt={`${productName} 縮圖 ${index + 1}`} loading="lazy" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      <div className="relative w-full aspect-square sm:aspect-auto sm:h-[520px] flex-1 overflow-hidden bg-[#FCF9F6] border-[3px] border-[#3D2419] shadow-[4px_4px_0px_0px_#3D2419]">
        {isLoading && (
          <div className="absolute inset-0 animate-pulse bg-linear-to-br from-[#F2E8DF] via-[#FCF9F6] to-[#E6D4C5]" aria-label="圖片載入中" />
        )}
        <img
          src={toImageUrl(selectedImage)}
          alt={productName}
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
          className={`h-full w-full object-cover transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
        />
      </div>
    </div>
  );
}
