"use client";

import { useState, useEffect, useCallback } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import NewsCard from "../home/NewsCard";

const Search = ({ categoryId = null, placeholder = "Tìm kiếm tin tức...", onSearchStateChange }) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Notify parent when search state changes
    useEffect(() => {
        if (onSearchStateChange) {
            onSearchStateChange(showResults);
        }
    }, [showResults, onSearchStateChange]);

    // Debounced search
    useEffect(() => {
        if (query.trim().length === 0) {
            setResults([]);
            setShowResults(false);
            return;
        }

        setIsSearching(true);
        const timer = setTimeout(async () => {
            try {
                const params = new URLSearchParams({ q: query });
                if (categoryId) {
                    params.append('categoryId', categoryId);
                }

                const response = await fetch(`/api/search?${params}`);
                const data = await response.json();

                setResults(data.results || []);
                setShowResults(true);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [query, categoryId]);

    const handleClear = () => {
        setQuery("");
        setResults([]);
        setShowResults(false);
    };

    return (
        <div className="w-full mb-6">
            {/* Search Input */}
            <div className="relative max-w-2xl mx-auto">
                <div className="relative">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={placeholder}
                        className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                    {query && (
                        <button
                            onClick={handleClear}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Loading indicator */}
                {isSearching && (
                    <div className="absolute right-12 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {/* Search Results */}
            {showResults && (
                <div className="mt-6">
                    {results.length > 0 ? (
                        <>
                            <div className="mb-4 text-gray-600">
                                Tìm thấy {results.length} kết quả cho "{query}"
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        </>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <SearchIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg">Không tìm thấy kết quả cho "{query}"</p>
                            <p className="text-sm mt-2">Thử tìm kiếm với từ khóa khác</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Search;
