"use client";
import React, { useState, useEffect, useRef } from "react";
import { Search, Bell, LogOut, User as UserIcon, ChevronDown, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import Navigation from "./Navigation";

const StickyHeader = ({ user, categories = [], activeSlug = null, onCategoryChange, forceVisible = false }) => {
    const [isVisible, setIsVisible] = useState(forceVisible);
    const [searchQuery, setSearchQuery] = useState("");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const router = useRouter();

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

    useEffect(() => {
        if (forceVisible) {
            setIsVisible(true);
            return;
        }

        const handleScroll = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [forceVisible]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?keyword=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    if (!isVisible) return null;

    return (
        <div className={`${forceVisible ? 'relative' : 'fixed top-0 left-0 right-0'} z-60 bg-white shadow-[0_2px_16px_rgba(54,56,79,0.06)] h-14 flex items-center transition-all duration-300 animate-in fade-in ${!forceVisible ? 'slide-in-from-top-4' : ''}`}>
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
                        {user ? (
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="flex items-center gap-2 hover:text-[#ff2d2d] transition-colors cursor-pointer py-1"
                                >
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover border border-gray-200" />
                                    ) : (
                                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                            <UserIcon size={14} />
                                        </div>
                                    )}
                                    <span className="text-sm font-medium text-gray-700">{user.name || user.email}</span>
                                    <ChevronDown size={14} className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isMenuOpen && (
                                    <div className="absolute -right-1 mt-1 w-90 bg-gray-100 p-4 shadow-lg rounded-xl overflow-hidden transition-all duration-200 border border-gray-100 text-gray-900">
                                        <div className="flex flex-col gap-2 items-center justify-center pt-2 pb-3">
                                            {user.avatar ? (
                                                <img
                                                    src={user.avatar}
                                                    alt="avatar"
                                                    className="w-12 h-12 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-gray-400">
                                                    <UserIcon size={24} />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-semibold">{user.name || 'User'}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col bg-white rounded-xl overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsMenuOpen(false);
                                                    router.push('/history');
                                                }}
                                                className="flex items-center gap-3 text-[#595959] p-4 w-full hover:bg-gray-100 cursor-pointer transition-colors"
                                            >
                                                <Clock size={16} />
                                                <span className="font-medium">Lịch sử đọc</span>
                                            </button>

                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-3 text-red-600 p-4 w-full hover:bg-gray-100 cursor-pointer transition-colors"
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
                                className="bg-[#ff2d2d] text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-[#cc2424] transition-colors cursor-pointer"
                            >
                                Đăng nhập
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StickyHeader;
