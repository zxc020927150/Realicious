"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Breadcrumbs from "../../_components/Breadcrumbs";
import ProductPhoto from "./_components/ProductPhoto";
import Hashtag from "./_components/Hashtag";
import QuantityPicker from "../../_components/QuantityPicker";
import CartButtons from "../../_components/CartButtons";
import Favorite from "../../_components/Favorite";
import PurchaseButton from "./_components/PurchaseButton";
import ProductDescription from "./_components/ProductDescription";
import TicketInfo from "./_components/TicketInfo";
import RelatedProducts from "./_components/RelatedProducts";
import { getProductById, type Product } from "@/lib/shop/product";
import { getFavorites } from "@/lib/shop/favorites";
import { useUser } from "@/app/context/user";

export default function ProductsPage() {
  const { user } = useUser();
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    getProductById(id).then((res) => {
      if (res.success) setProduct(res.data);
    });
  }, [id]);

  useEffect(() => {
    if (!user?.id) return;
    getFavorites(Number(user.id)).then((res) => {
      if (res.success) setIsFavorited(res.data.some((f: { product_id: number }) => f.product_id === Number(id)));
    });
  }, [user?.id, id]);

  if (!product) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        {/* 載入中狀態提示框 */}
        <div className="p-8 bg-[#FCF9F6] border-[3px] border-[#3D2419] shadow-[4px_4px_0px_0px_#3D2419] text-xl font-black text-[#3D2419] tracking-wider select-none">
          🎒 正在翻找背包中...
        </div>
      </div>
    );
  }

  const soldOut = product.stock_qty <= 0;

  return (
    <div className="relative min-h-screen pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* 手機保留單一返回入口；較大螢幕才顯示完整路徑。 */}
        <div className="py-6">
          <Link
            href="/shop"
            className="inline-flex sm:hidden items-center px-3 py-2 text-sm font-bold text-[#1A1721] bg-[#FFF0B8] border-2 border-[#3D2419] shadow-[2px_2px_0px_0px_#3D2419] hover:bg-[#FFD45C] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            ← 返回商品列表
          </Link>
          <div className="hidden sm:block">
            <Breadcrumbs items={[
              { label: "首頁", href: "/" },
              { label: "商品列表", href: "/shop" },
              { label: product.name }
            ]} />
          </div>
        </div>

        {/* 商品主區塊：手機上下排列，桌機才左右並排 */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* 圖片相簿：手機滿寬，桌機固定在左側 */}
          <div className="w-full lg:w-[52%] xl:w-[600px] shrink-0">
            <ProductPhoto key={product.id} mainImage={product.main_img} images={product.images} productName={product.name} />
          </div>

          {/* 購買決策區：手機會接在圖片下方 */}
          <div className="w-full lg:flex-1 flex flex-col items-start text-left select-none">
            
            {/* 實心對話框文字字卡（全面直角） */}
            <div className="w-full bg-[#FCF9F6] border-[3px] border-[#3D2419] px-5 pt-4 pb-6 shadow-[4px_4px_0px_0px_#3D2419] mb-6">
              {/* 標籤列 */}
              <Hashtag productName={product.name} />
              
              {/* 商品名稱 */}
              <h2 className="text-3xl font-black text-[#3D2419] tracking-wide leading-tight">
                {product.name}
              </h2>
              
              {/* 像素風分割虛線 */}
              <hr className="border-t-[2px] border-dashed border-[#3D2419]/20 mt-3 mb-5" />
              
              {/* 價格 */}
              <div className="text-3xl font-black text-[#8C5230] tracking-wider">
                ${product.price}
              </div>
            </div>

            {/* 下方選項控制區：寬度對齊大卡片 */}
            <div className="w-full flex flex-col gap-6 pl-1">
              <TicketInfo />

              {/* 數量選擇器 */}
              <div className="flex flex-wrap items-center gap-4 text-base font-bold text-[#3D2419]">
                {soldOut ? (
                  <div
                    role="status"
                    className="flex w-full items-center justify-between gap-3 border-[3px] border-[#3D2419] bg-[#FFF0B8] px-4 py-3 shadow-[3px_3px_0px_0px_#3D2419]"
                  >
                    <span className="font-black text-[#BB0015]">暫時售完</span>
                    <span className="text-sm text-[#3D2419]/65">目前無可購買數量，敬請期待補貨</span>
                  </div>
                ) : (
                  <>
                    <QuantityPicker value={qty} onChange={setQty} max={product.stock_qty} />
                    <span className="text-sm text-[#3D2419]/60 bg-gray-100 px-2.5 py-1 border border-gray-300">
                      可購買數量: {product.stock_qty}
                    </span>
                  </>
                )}
              </div>

              {/* 加入購物車 + 收藏 按鈕列 */}
              <div className="flex flex-row items-center gap-3 w-full">
                {/* 讓加入購物車按鈕完全延伸填滿左側 */}
                <div className="flex-1">
                  <CartButtons product={product} qty={qty} />
                </div>
                {/* 愛心按鈕保持方形緊貼在旁 */}
                <div className="shrink-0">
                  <Favorite productId={product.id} initialFavorited={isFavorited} />
                </div>
              </div>

              {/* 立即購買大按鈕 */}
              <div className="w-full">
                <PurchaseButton
                  product={{
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    main_img: product.main_img,
                    stock_qty: product.stock_qty,
                  }}
                  qty={qty}
                />
              </div>
            </div>

          </div>
        </div>

        {/* 商品大描述區塊 */}
        <div className="mt-16 border-t-[3px] border-[#3D2419] pt-12">
          <ProductDescription description={product.description} />
        </div>

        <RelatedProducts product={product} />
      </div>
    </div>
  );
}
