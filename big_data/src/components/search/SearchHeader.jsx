"use client";
import { Search, LogOut, User as UserIcon, ChevronDown, Clock } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const SearchHeader = ({ user }) => {
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get("keyword") || "");
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.refresh();
        setIsMenuOpen(false);
    };

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
                    <Link href="/" className="hover:underline font-medium">Trang chủ</Link>
                    {user ? (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex items-center gap-2 hover:text-[#f04142] transition-colors cursor-pointer py-1"
                            >
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover border border-gray-200" />
                                ) : (
                                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                        <UserIcon size={16} />
                                    </div>
                                )}
                                <span className="text-sm font-medium text-gray-700">{user.name || user.email}</span>
                                <ChevronDown size={14} className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isMenuOpen && (
                                <div className="absolute -right-1 mt-1 w-90 bg-gray-100 p-4 shadow-lg rounded-xl overflow-hidden transition-all duration-200">
                                    <div
                                        className="flex flex-col gap-2 items-center justify-center pt-2 pb-3"
                                    >
                                        <img
                                            src={user.avatar}
                                            alt="avatar"
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                        <div>
                                            <p className="font-semibold">{user.name || 'User'}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col bg-white rounded-xl">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsMenuOpen(false);
                                                router.push('/history');
                                            }}
                                            className="flex items-center gap-3
                            text-[#595959] p-4 w-full h-full hover:bg-gray-100 cursor-pointer"
                                        >
                                            <Clock size={16} />
                                            <span className="font-medium">Lịch sử đọc</span>
                                        </button>



                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-3 text-red-600 p-4 w-full h-full hover:bg-gray-100 cursor-pointer"
                                        >
                                            <LogOut size={16} />
                                            <span className="font-medium">Đăng xuất</span>
                                        </button>
                                    </div>

                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => router.push('/login')}
                            className="bg-[#f04142] text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-[#e02424] transition-colors cursor-pointer"
                        >
                            Đăng nhập
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default SearchHeader;
