"use client";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const SearchHeader = () => {
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get("keyword") || "");
    const [isScrolled, setIsScrolled] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
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

    return (
        <header className={`w-full pl-6 h-[76px] py-4 bg-white sticky top-0 z-50 transition-shadow ${isScrolled ? "shadow-[0_4px_8px_rgba(0,0,0,0.06)]" : ""}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                    {/* Logo */}
                    <Link href="/" className="text-[15px] font-medium cursor-pointer shrink-0 text-gray-700">
                        <span className="bg-[#f04142]  text-white py-1 px-1.5 mr-0.5 rounded">
                            Tin Tức
                        </span>
                        Hôm Nay
                    </Link>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="w-[588px] flex">
                        <div className="relative flex-1">
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm tin tức..."
                                className="w-full text-[15px] text-gray-900 h-[42px] pl-4 pr-10 bg-transparent border border-gray-300 rounded-l-lg outline-none transition-all"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="h-[42px] px-6 bg-[#f04142] text-white rounded-r-lg hover:bg-[#e02424] transition-colors flex items-center justify-center cursor-pointer"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    </form>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-8 text-sm text-gray-600 mr-8">
                    <Link href="/" className="hover:underline">Trang chủ</Link>
                    <button className="px-3 py-1 border border-gray-300 rounded hover:opacity-80 cursor-pointer">Đăng nhập</button>
                </div>
            </div>
        </header>
    );
};

export default SearchHeader;
