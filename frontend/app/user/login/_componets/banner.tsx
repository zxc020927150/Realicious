"use client";
import Image from "next/image";
import like_img from "@/public/user/like.png";
import chicken_happy from "@/public/user/default_avatars/chicken_happy.png";

import localFont from "next/font/local";
const myCustomFont = localFont({
  src: "../../../../public/user/Cubic_11.ttf", // 字體檔案路徑
  display: "swap",
});

export default function Banner() {
  return (
    <div className="w-full h-full flex flex-col p-10 bg-[#30254a] bg-[url(/user/always-grey.png)] bg-repeat bg-size-45px_45px">
      <h2 className={`${myCustomFont.className} text-white text-5xl mt-20 mb-4`}>好吃的</h2>
      <h2 className={`${myCustomFont.className} text-amber-400 text-5xl pl-4`}>都在這裡</h2>
      <div className="flex justify-end">
        <Image className="animate-pulse-slow" src={like_img} alt="" width={120} />
      </div>
      <p className="text-white text-xl mt-4 mb-10 flex justify-center items-center">
        探索美食、揪團吃飯，和大家一起分享每一口美味！
      </p>
      <div className="flex p-4 border-4 border-dotted border-amber-400">
        <Image src={chicken_happy} alt="" width={200} className="" />
        <div className="text-white text-xl flex flex-col justify-center items-start gap-2">
          <p>立即登入</p>
          <p>開始你的美味之旅！</p>
        </div>
      </div>
    </div>
  );
}
