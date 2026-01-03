import { useState, useRef, useEffect } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
import { decodeHtml } from "@/lib/utils";
import TextToSpeech from "@/components/shared/TextToSpeech";
import NewsPreviewCard from "./NewsPreviewCard";

const NewsCard = ({ article }) => {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 500); // Delay to avoid accidental hovers
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 200); // Small delay to allow moving to preview card
  };

  const handleClosePreview = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(false);
  };

  const timeAgo = article.published_at
    ? formatDistanceToNowStrict(new Date(article.published_at), {
      addSuffix: true,
      locale: vi,
      roundingMethod: "floor",
    }).replace("khoảng ", "")
    : "Vừa xong";

  const publishedDate = article.published_at
    ? new Date(article.published_at)
    : null;
  const daysAgo = publishedDate
    ? Math.floor((Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const displayTime =
    daysAgo > 30 ? publishedDate.toLocaleDateString("vi-VN") : timeAgo;

  return (
    <article className={`flex items-start gap-5 py-5 cursor-pointer relative group ${isHovered ? 'z-50' : 'z-0'}`}>
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="font-medium text-gray-700">
            {article.source || "Tin tức"}
          </span>
          <span className="opacity-70">{timeAgo}</span>
        </div>

        <a
          href={article.url}
          target="_blank"
          className="text-base font-medium text-gray-900 leading-relaxed line-clamp-2 transition-colors hover:text-[#ff4747] m-0"
        >
          {decodeHtml(article.title)}
        </a>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="px-2 py-0.5 bg-black/5 text-gray-700 rounded text-xs">
              {article.category || "Tổng hợp"}
            </span>
            <Link href={`/?cluster_id=${article.cluster_id}`} className="flex items-center gap-1 text-gray-500 transition-colors hover:text-[#ff4747]">
              {article.size > 1 ? `${article.size} liên quan` : ""}
            </Link>
          </div>
        </div>
      </div>

      <div
        className="shrink-0 w-38.75 h-26 bg-gray-100 rounded-lg relative z-10"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {article.image_url ? (
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            {article.source || "Tin tức"}
          </div>
        )}
      </div>
      {isHovered && (
        <div className="absolute -top-18 -right-28 z-50 origin-top-right scale-in opacity-100">
          <NewsPreviewCard
            article={article}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClose={handleClosePreview}
          />
        </div>
      )}
    </article>
  );
};

export default NewsCard;
