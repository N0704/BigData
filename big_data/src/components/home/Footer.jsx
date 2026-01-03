"use client";

import React from "react";
import Link from "next/link";

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-100/50 shadow-[0_-2px_16px_rgba(54,56,79,0.06)] py-8 mt-12">
            <div className="max-w-265 mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
                    {/* Brand Section */}
                    <div className="max-w-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-[#ff2d2d] rounded-lg flex items-center justify-center text-white font-bold text-xl">
                                T
                            </div>
                            <span className="text-xl font-bold text-gray-900 tracking-tight">
                                Tin Tức Hôm Nay
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Nền tảng tổng hợp tin tức thông minh, cập nhật liên tục 24/7 từ các nguồn báo chí uy tín hàng đầu Việt Nam. Trải nghiệm đọc tin hiện đại với công nghệ AI.
                        </p>
                    </div>

                    {/* Links Sections */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
                        <div>
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Khám phá</h4>
                            <ul className="space-y-2">
                                <li><Link href="/" className="text-gray-500 hover:text-[#ff4d4f] text-sm transition-colors">Trang chủ</Link></li>
                                <li><Link href="/?category=the-gioi" className="text-gray-500 hover:text-[#ff4d4f] text-sm transition-colors">Thế giới</Link></li>
                                <li><Link href="/?category=cong-nghe" className="text-gray-500 hover:text-[#ff4d4f] text-sm transition-colors">Công nghệ</Link></li>
                                <li><Link href="/?category=kinh-doanh" className="text-gray-500 hover:text-[#ff4d4f] text-sm transition-colors">Kinh doanh</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Thông tin</h4>
                            <ul className="space-y-2">
                                <li><Link href="#" className="text-gray-500 hover:text-[#ff4d4f] text-sm transition-colors">Giới thiệu</Link></li>
                                <li><Link href="#" className="text-gray-500 hover:text-[#ff4d4f] text-sm transition-colors">Điều khoản</Link></li>
                                <li><Link href="#" className="text-gray-500 hover:text-[#ff4d4f] text-sm transition-colors">Bảo mật</Link></li>
                                <li><Link href="#" className="text-gray-500 hover:text-[#ff4d4f] text-sm transition-colors">Liên hệ</Link></li>
                            </ul>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Ứng dụng</h4>
                            <div className="flex flex-col gap-3">
                                <button className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-xs font-medium">
                                    <span>App Store</span>
                                </button>
                                <button className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-xs font-medium">
                                    <span>Google Play</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-400 text-xs">
                        © {currentYear} Tin Tức Hôm Nay. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <span className="text-gray-400 text-xs cursor-pointer hover:text-gray-600">Facebook</span>
                        <span className="text-gray-400 text-xs cursor-pointer hover:text-gray-600">Twitter</span>
                        <span className="text-gray-400 text-xs cursor-pointer hover:text-gray-600">YouTube</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
