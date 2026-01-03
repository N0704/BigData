"use client";
import { decodeHtml } from '@/lib/utils';
import { useState, useRef } from 'react';
import NewsPreviewCard from './NewsPreviewCard';

const TrendingNews = ({ clusters = [] }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const hoverTimeoutRef = useRef(null);

  const handleMouseEnter = (index) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredIndex(index);
    }, 500);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredIndex(null);
    }, 200);
  };

  const handleClosePreview = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredIndex(null);
  };

  const hotList = clusters.map(c => ({
    id: c.cluster_id,
    title: c.title,
    url: c.url,
    tag: c.size > 2 ? "Nóng" : null,
    original: c
  }));

  return (
    <aside className="bg-white rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm">
          <span>🔥</span>
          <span>Bảng xếp hạng tin nóng</span>
        </div>
        <button className="text-xs text-gray-400 hover:text-[#ff4d4f]">
          Đổi tin khác
        </button>
      </div>

      {/* List */}
      <ul className="px-4 py-2">
        {hotList.map((item, index) => (
          <li
            key={item.id}
            className="flex items-start gap-3 py-2 group relative"
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            {/* Rank */}
            <span
              className={`w-4 text-sm font-medium ${index < 3 ? "text-[#ff4d4f]" : "text-gray-400"
                }`}
            >
              {index + 1}
            </span>

            <a
              href={item.url}
              target="_blank"
              className="block text-[14px] leading-relaxed text-gray-800 group-hover:text-[#ff4d4f] cursor-pointer"
            >
              {decodeHtml(item.title)}
            </a>

            {/* Tag */}
            {item.tag && (
              <span
                className={`ml-1 px-1.5 py-px text-[10px] rounded ${item.tag === "Nóng"
                  ? "bg-[#ff4d4f]/10 text-[#ff4d4f]"
                  : "bg-orange-100 text-orange-500"
                  }`}
              >
                {item.tag}
              </span>
            )}

            {hoveredIndex === index && (
              <div
                className="
                absolute
                -left-12
                top-25 -translate-y-1/2
                z-50
                origin-left
                scale-in
                pointer-events-auto
              "
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
              >
                <NewsPreviewCard
                  article={item.original}
                  onClose={handleClosePreview}
                />
              </div>
            )}
          </li>
        ))}

      </ul>
    </aside>
  );
};

export default TrendingNews;
