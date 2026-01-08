"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import NewsCard from "./NewsCard";
import Navigation from "./Navigation";
import TopNews from "./TopNews";
import TrendingNews from "./TrendingNews";
import NewsFeed from "./NewsFeed";
import StickyHeader from "./StickyHeader";
import Footer from "./Footer";

const Layout = ({ user, categories = [], news = [], clusters = [], hotToday = [] }) => {
  const [activeCategory, setActiveCategory] = useState(null);
  const searchParams = useSearchParams();
  const clusterId = searchParams.get("cluster_id");
  const router = useRouter();

  const handleCategoryChange = (slug) => {
    setActiveCategory(slug);
    if (clusterId) {
      router.push('/', { scroll: false });
    }
  };

  return (
    <>
      <StickyHeader
        user={user}
        categories={categories}
        activeSlug={activeCategory}
        onCategoryChange={handleCategoryChange}
      />
      <div className="max-w-265 mx-auto px-4 pt-4 flex justify-between">
        <div className="w-164.5 flex flex-col">
          <Navigation
            categories={categories}
            activeSlug={activeCategory}
            onCategoryChange={handleCategoryChange}
            className="mb-2"
          />
          {!activeCategory && !clusterId && <TopNews hotToday={hotToday} />}
          <NewsFeed
            initialNews={news}
            categorySlug={activeCategory}
            clusterId={clusterId}
            user={user}
          />
        </div>
        <div className="w-79.5 shrink-0">
          <TrendingNews clusters={clusters} />
          <div className="flex flex-row justify-between items-center p-3 rounded-lg mt-6 bg-qr">
            <div className="pr-2">
              <div className="text-sm leading-6 font-medium text-black mb-0.75">
                Quét mã QR để tải ứng dụng Tin Tức Hôm Nay.
              </div>
              <div className="text-xs leading-4 text-[#6f7073]">
                Xem những tin tức mới và nóng hổi nhất.
              </div>
            </div>
            <div className="w-14 h-12 bg-white bg-[url('https://lf3-static.bytednsdoc.com/obj/eden-cn/beeh7nuvjvho/qrcode.png')] bg-no-repeat bg-center bg-contain rounded"></div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Layout;
