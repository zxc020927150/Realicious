import React from "react";
import { useRouter } from "next/navigation";

const keywordMap: { label: string; keyword: string }[] = [
  { label: "火鍋", keyword: "鍋" },
  { label: "速食", keyword: "麥丹勞" },
  { label: "吃到飽", keyword: "饗食" },
  { label: "炸物", keyword: "炸雞" },
  { label: "電子雞服裝", keyword: "電子雞服裝" },
  { label: "虛擬頭像框", keyword: "虛擬頭像框" },
];

type HashtagProps = {
  productName: string;
};

export default function Hashtag({ productName }: HashtagProps) {
  const router = useRouter();

  // 找出商品名稱符合哪些關鍵字
  const matchedTags = keywordMap.filter((tag) =>
    productName.includes(tag.keyword)
  );

  if (matchedTags.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-3 mb-3">
      {matchedTags.map((tag) => (
        <div key={tag.label}
          onClick={() => router.push(`/shop?keyword=${encodeURIComponent(tag.keyword)}`)}
          className="inline-flex items-center gap-1.5 px-3 py-1
                        bg-[#FFD3B6] text-[#3D2419] font-bold text-sm
                        border-[3px] border-[#3D2419]
                        shadow-[2px_2px_0px_0px_#3D2419] select-none cursor-pointer
                        hover:bg-[#ffbe94] transition-colors"
        >
          {tag.label}
        </div>
      ))}
    </div>
  );
}
