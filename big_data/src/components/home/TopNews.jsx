"use client";
import { decodeHtml } from '@/lib/utils';
import { useState, useRef } from 'react';
import Link from 'next/link';
import NewsPreviewCard from './NewsPreviewCard';

export default function TopNews({ hotToday = [] }) {
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

  // Ngày hiện tại đẹp kiểu Việt Nam
  const currentDate = new Date().toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
  }).replace(/,/g, ' ·');

  return (
    <div className="py-5 px-8 bg-news-soft rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="bg-[#ff4d4f] text-white text-sm font-semibold px-2 py-0.5 rounded">
          Tin nổi bật hôm nay
        </span>
        <span className="text-gray-400 text-sm">{currentDate}</span>
      </div>

      {/* List */}
      {hotToday.length > 0 ? (
        <ul className="space-y-3">
          {hotToday.map((item, index) => (
            <li
              key={item.cluster_id || item.news_id}
              className="flex items-start gap-3 relative"
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
            >
              <span className="mt-2 w-1 h-1 bg-gray-400 rounded-full shrink-0" />
              <Link
                href={item.url} target="_blank"
                className="text-[15px] text-gray-800 leading-relaxed hover:text-[#ff4d4f] transition-colors line-clamp-2"
              >
                {decodeHtml(item.title)}
              </Link>

              {hoveredIndex === index && (
                <div className="absolute top-20 right-25 -translate-y-1/2 z-50  scale-in opacity-100">
                  <NewsPreviewCard
                    article={item}
                    onMouseEnter={() => handleMouseEnter(index)}
                    onMouseLeave={handleMouseLeave}
                    onClose={handleClosePreview}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 text-sm">Chưa có tin nổi bật hôm nay</p>
      )}
    </div>
  );
}