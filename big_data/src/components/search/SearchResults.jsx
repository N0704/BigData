"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { ChevronDown, ListFilter, Search as SearchIcon } from "lucide-react";
import NewsCard from "../home/NewsCard";
import TrendingNews from "../home/TrendingNews";

const SearchResults = ({ hotClusters = [] }) => {
    const searchParams = useSearchParams();
    const query = searchParams.get("keyword") || "";

    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(true);

    useEffect(() => {
        if (!query.trim()) {
            setIsSearching(false);
            return;
        }

        const fetchResults = async () => {
            setIsSearching(true);
            try {
                const response = await fetch(`/api/search?keyword=${encodeURIComponent(query)}`);
                const data = await response.json();
                setResults(data.results || []);
            } catch (error) {
                console.error("Search error:", error);
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        fetchResults();
    }, [query]);

    if (!query.trim()) {
        return (
            <div className="pl-[184.13px] flex items-start gap-20">
                <div className="w-[588px] text-center py-12 text-gray-500 bg-white">
                    <SearchIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">Nhập từ khóa để tìm kiếm</p>
                </div>
                <div className="w-80 shrink-0">
                    <TrendingNews clusters={hotClusters} />
                </div>
            </div>
        );
    }

    return (
        <div className="pl-[184.13px] flex items-start gap-20 mb-8">
            {/* Left Column: Results */}
            {isSearching ? (
                <div className="w-[588px] flex flex-col">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="py-4 flex gap-4 animate-pulse">
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                                <div className="h-5 bg-gray-200 rounded w-4/5 mb-3"></div>
                                <div className="flex gap-3">
                                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                                </div>
                            </div>
                            <div className="w-38.75 h-26 bg-gray-200 rounded-lg shrink-0"></div>
                        </div>
                    ))}
                </div>
            ) : results.length > 0 ? (
                <div className="w-[588px] flex flex-col">
                    {results.map((article) => (
                        <NewsCard
                            key={article.news_id}
                            article={{
                                ...article,
                                id: article.news_id,
                                category: article.category,
                            }}
                        />
                    ))}
                </div>
            ) : (
                <div className="w-[588px] py-12 text-center">
                    <SearchIcon className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                    <p className="text-lg text-gray-600">Không tìm thấy kết quả nào</p>
                    <p className="text-sm text-gray-400 mt-2">Hãy thử từ khóa khác hoặc xem tin nóng bên cạnh</p>
                </div>
            )}

            {/* Right Column: Trending */}
            <div className="w-80 shrink-0">
                <TrendingNews clusters={hotClusters} />
            </div>
        </div>
    );
};

export default SearchResults;
