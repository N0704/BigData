"use client";

import { useState } from "react";
import UserPreferences from "@/components/user/UserPreferences";
import NewsCard from "@/components/home/NewsCard";
import { getUserReadHistory } from "@/lib/actions/news";
import { Clock, BookOpen } from "lucide-react";

const ReadHistoryContent = ({ user, initialHistory }) => {
    const [history, setHistory] = useState(initialHistory);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialHistory.length >= 20);

    const loadMore = async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const nextPage = page + 1;
            const newHistory = await getUserReadHistory(user.id, nextPage, 20);

            if (newHistory.length === 0) {
                setHasMore(false);
            } else {
                setHistory((prev) => [...prev, ...newHistory]);
                setPage(nextPage);
            }
        } catch (error) {
            console.error("Error loading more history:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatReadTime = (readAt) => {
        const date = new Date(readAt);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Vừa xong";
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;

        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    return (
        <div className="pl-[184.13px] flex items-start gap-20 mb-8 mt-3">
            {/* Left Column - Read History */}
            <div className="w-[588px] flex flex-col">
                <h2 className="text-base font-semibold text-gray-900">
                    Lịch sử đọc của bạn
                </h2>

                {history.length === 0 ? (
                    <div className="bg-white rounded-lg p-12 text-center border border-gray-100">
                        <Clock size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Chưa có lịch sử đọc
                        </h3>
                        <p className="text-gray-600">
                            Bắt đầu đọc các bài báo để xem lịch sử tại đây
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col">
                            {history.map((article) => (
                                <div
                                    key={`${article.read_log_id}-${article.news_id}`}
                                    className="group relative"
                                >
                                    {/* Read Time Badge */}
                                    <div className="absolute bottom-6 right-50 flex items-center gap-2 text-xs text-gray-400 mb-1">
                                        <Clock size={14} />
                                        <span>Đã đọc {formatReadTime(article.read_at)}</span>
                                    </div>

                                    {/* News Card */}
                                    <NewsCard article={article} />
                                </div>
                            ))}
                        </div>

                        {/* Load More Button */}
                        {hasMore && (
                            <div className="mt-8 text-center pb-8">
                                <button
                                    onClick={loadMore}
                                    disabled={loading}
                                    className="px-8 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2 mx-auto"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                            Đang tải...
                                        </>
                                    ) : (
                                        "Xem thêm lịch sử"
                                    )}
                                </button>
                            </div>
                        )}

                        {!hasMore && history.length > 0 && (
                            <div className="mt-8 text-center text-sm text-gray-400 pb-8">
                                Đã hiển thị tất cả lịch sử đọc
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Right Column - User Preferences */}
            <div className="w-80 shrink-0">
                <UserPreferences userId={user.id} />

                {/* Stats Card */}
                <div className="mt-10 bg-white">
                    <h3 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
                        <BookOpen size={20} className="text-[#f04142]" />
                        Thống kê đọc
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500 font-medium">Tổng bài đã đọc</span>
                            <span className="text-xl font-black text-[#f04142]">
                                {history.length}+
                            </span>
                        </div>
                        <div className="h-px bg-gray-50 w-full"></div>
                        <p className="text-[12px] text-gray-400 leading-relaxed">
                            Càng đọc nhiều, hệ thống càng đề cử tin tức chính xác hơn cho bạn.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReadHistoryContent;
