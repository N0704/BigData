"use client";
import { Search } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?keyword=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  return (
    <header className="relative text-white">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <video
          className="w-full h-68.25 object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/earth_v6.mp4" type="video/mp4" />
        </video>
      </div>

      {/* ===== TOP BAR ===== */}
      <div className="relative z-10">
        <div className="max-w-350 mx-auto px-4 h-10 flex justify-between items-center text-sm text-white/80">
          <div className="flex gap-6">
            <a className="hover:text-white cursor-pointer">Tải ứng dụng</a>
            <a className="hover:text-white cursor-pointer">Giới thiệu</a>
            <a className="hover:text-white cursor-pointer">Phản hồi</a>
            <a className="hover:text-white cursor-pointer">
              Khiếu nại bản quyền
            </a>
          </div>

          <div className="flex items-center gap-4">
            <span className="hover:text-white cursor-pointer">Thông báo</span>
            <button className="bg-[#ff2d2d] px-3 py-1 rounded text-white cursor-pointer">
              Đăng nhập
            </button>
          </div>
        </div>
      </div>

      {/* ===== CENTER ===== */}
      <div className="relative z-10 py-10">
        <div className="flex flex-col items-center gap-5 w-176 h-39.25 mx-auto">
          <h1 className="text-4xl font-semibold tracking-wide">
            Tin Tức Hôm Nay
          </h1>

          <form onSubmit={handleSearch} className="relative w-176 bg-[hsla(0,0%,100%,0.85)] backdrop-blur-2xl rounded-lg">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tìm kiếm tin tức mới nhất"
              className="
                w-full h-full text-base leading-5 text-[#222] pl-4.5 py-3.5 bg-transparent rounded-lg z-10 outline-none
              "
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ff2d2d] hover:text-[#cc2424] transition-colors"
            >
              <Search className="w-6 h-6" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
};

export default Header;
