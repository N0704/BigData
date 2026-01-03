'use client';

import { formatDistanceToNowStrict } from "date-fns";
import { vi } from "date-fns/locale";
import { decodeHtml } from "@/lib/utils";
import TextToSpeech from "@/components/shared/TextToSpeech";
import Link from "next/link";

const NewsPreviewCard = ({ article, onMouseEnter, onMouseLeave, onClose }) => {
    if (!article) return null;

    const timeAgo = article.published_at
        ? formatDistanceToNowStrict(new Date(article.published_at), {
            addSuffix: true,
            locale: vi,
            roundingMethod: "floor",
        }).replace("khoảng ", "")
        : "Vừa xong";

    return (
        <div
            className="w-[380px] bg-white rounded-xl shadow-2xl overflow-hidden "
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {/* Image Section */}
            <div className="relative h-56 w-full">
                {article.image_url ? (
                    <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                        {article.source || "Tin tức"}
                    </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-white via-transparent to-transparent" />

            </div>

            {/* Content Section */}
            <div className="px-4 pt-4 -mt-8 relative z-10">
                <a
                    href={article.url}
                    target="_blank"
                    className="text-lg font-medium text-gray-900 leading-relaxed hover:opacity-80">
                    {decodeHtml(article.title)}
                </a>
                {/* Metadata Badges */}
                <div className="flex flex-wrap gap-2 mt-2 mb-3 text-xs">
                    <span className="px-2 py-1 bg-gray-900 text-white rounded font-medium">
                        {article.source || "Tin tức"}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">{timeAgo}</span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        {article.category || "Tổng hợp"}
                    </span>
                    {article.size > 1 ?
                        (<Link href={`/?cluster_id=${article.cluster_id}`} className="px-2 py-1 bg-gray-100 text-gray-700 rounded ">
                            {article.size} liên quan
                        </Link>) : null}
                </div>

                {/* Summary */}
                <div className="text-xs text-gray-600 mb-4 leading-relaxed">
                    {article.summary || "Đang cập nhật tóm tắt cho bản tin này..."}
                </div>

                {/* Listen Section */}
                <div className="flex items-center justify-between py-2 border-t border-gray-200">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Nghe bản tin</span>
                    <TextToSpeech
                        newsId={article.news_id || article.id}
                        article={article}
                        onPlayStart={onClose}
                    />
                </div>
            </div>
        </div>
    );
};

export default NewsPreviewCard;
