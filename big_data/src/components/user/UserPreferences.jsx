"use client";

import { useState, useEffect } from "react";
import { getUserPreferredCategories } from "@/lib/actions/news";


const UserPreferences = ({ userId }) => {
    const [preferences, setPreferences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const fetchPreferences = async () => {
            try {
                setLoading(true);
                const data = await getUserPreferredCategories(userId, 30);
                setPreferences(data);
            } catch (err) {
                console.error("Error fetching preferences:", err);
                setError("Không thể tải thông tin sở thích");
            } finally {
                setLoading(false);
            }
        };

        fetchPreferences();
    }, [userId]);

    if (!userId) {
        return (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-gray-500 text-sm">
                    Đăng nhập để xem các chủ đề bạn quan tâm
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
            </div>
        );
    }

    if (preferences.length === 0) {
        return (
            <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm mb-2 font-medium">
                    Chưa có dữ liệu sở thích
                </p>
                <p className="text-gray-500 text-xs">
                    Đọc thêm các bài báo để chúng tôi hiểu bạn hơn và đề cử nội dung phù hợp!
                </p>
            </div>
        );
    }

    // Tính tổng số lần đọc để tính %
    const totalReads = preferences.reduce((sum, p) => sum + p.read_count, 0);

    return (
        <div className="bg-white ">
            <h3 className="text-base font-semibold text-gray-900 mb-5">
                Chủ đề bạn quan tâm
            </h3>
            <p className="text-xs text-gray-500 mb-4">
                Dựa trên {totalReads} bài đã đọc trong 30 ngày qua
            </p>

            <div className="space-y-3">
                {preferences.map((pref, index) => {
                    const percentage = ((pref.read_count / totalReads) * 100).toFixed(0);

                    return (
                        <div key={pref.category_id} className="relative">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-gray-400">
                                        #{index + 1}
                                    </span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {pref.category_name}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-500">
                                    {pref.read_count} bài
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${index === 0
                                        ? "bg-red-500"
                                        : index === 1
                                            ? "bg-red-400"
                                            : "bg-red-300"
                                        }`}
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>

                            <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-gray-400">
                                    {pref.active_days} ngày hoạt động
                                </span>
                                <span className="text-xs font-medium text-red-600">
                                    {percentage}%
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    Chúng tôi sử dụng thông tin này để đề cử tin tức phù hợp với bạn
                </p>
            </div>
        </div>
    );
};

export default UserPreferences;
