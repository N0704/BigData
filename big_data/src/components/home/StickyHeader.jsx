"use client";
import React, { useState, useEffect } from "react";
import { Search, Bell, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Navigation from "./Navigation";

const StickyHeader = ({ categories = [], activeSlug = null, onCategoryChange }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?keyword=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-60 bg-white shadow-[0_2px_16px_rgba(54,56,79,0.06)] h-14 flex items-center transition-all duration-300 animate-in fade-in slide-in-from-top-4">
            <div className="max-w-350 mx-auto w-full px-4 flex items-center justify-between">
                {/* Left: Logo & Nav */}
                <div className="flex items-center gap-6">
                    <div
                        className="text-[15px] font-medium cursor-pointer shrink-0 text-gray-700"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                        <span className="bg-[#f04142]  text-white py-1 px-1.5 mr-0.5 rounded">
                            Tin Tức
                        </span>
                        Hôm Nay
                    </div>

                    <Navigation
                        categories={categories}
                        activeSlug={activeSlug}
                        onCategoryChange={onCategoryChange}
                        className="text-[15px] text-gray-700 shrink-0"
                        listClassName="gap-6"
                    />
                </div>

                {/* Right: Search & Actions */}
                <div className="flex items-center gap-6 shrink-0">
                    <form onSubmit={handleSearch} className="relative w-88">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm..."
                            className="w-full bg-gray-100 rounded-lg py-2 pl-3 pr-10 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-[#ff2d2d] transition-all"
                        />
                        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-[#ff2d2d] cursor-pointer">
                            <Search className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="flex items-center gap-4 text-gray-600">
                        <button className="flex items-center gap-1 hover:text-[#ff2d2d] transition-colors cursor-pointer">
                            <Bell className="w-5 h-5" />
                            <span className="text-xs">Thông báo</span>
                        </button>
                        <button className="bg-[#ff2d2d] text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-[#cc2424] transition-colors">
                            Đăng nhập
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StickyHeader;
