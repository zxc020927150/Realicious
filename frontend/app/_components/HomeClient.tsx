"use client";
import Hero from "../_components/HeroSection";
import ProductSection from "../_components/ProductSection";
import AccountingSection from "../_components/AccountingSection";
import ArticleSection from "../_components/ArticleSection";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect } from "react";
import PopularChatroomsSection from "../_components/PopularChatroomsSection";
import AmbientBackground from "@/components/AmbientBackground";

export default function HomeClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      router.replace(pathname);
    }
  }, [searchParams, router, pathname]);

  return (
    <>
      <div className="font-pixel">
        <Hero />

        <section className="relative py-24 overflow-hidden">
          <AmbientBackground />
          <div className="relative z-10 max-w-7xl mx-auto px-5">
            <ProductSection />
          </div>
        </section>

        <AccountingSection />

        <section className="relative pt-15 overflow-hidden">
          <AmbientBackground />
          <div className="relative z-10 max-w-7xl mx-auto px-5">
            <ArticleSection />
          </div>
          <div className="relative z-10 bg-gray-200">
            <div
              className="absolute inset-0 opacity-[0.5] pointer-events-none"
              style={{
                backgroundImage: "url('/article/noise.png')",
                backgroundRepeat: "repeat",
                backgroundSize: "90px",
              }}
            />
            <div className="relative z-10 mt-15">
              <PopularChatroomsSection />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
