"use client";
import { Search, LogOut, User as UserIcon, ChevronDown, Clock } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const Header = ({ user }) => {
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?keyword=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.refresh();
    setIsMenuOpen(false);
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
      <div className="relative z-40">
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
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer py-1"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover border border-white/20" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                      <UserIcon size={14} />
                    </div>
                  )}
                  <span className="font-medium">{user.name || user.email}</span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMenuOpen && (
                  <div className="absolute -right-1 mt-1 w-90 bg-gray-100 p-4 shadow-lg rounded-xl overflow-hidden transition-all duration-200 text-gray-900">
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
                className="bg-[#ff2d2d] px-3 py-1 rounded text-white cursor-pointer font-medium hover:bg-[#cc2424] transition-colors"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===== CENTER ===== */}
      <div className="relative z-10 py-10">
        <div className="flex flex-col items-center gap-5 w-176 h-39.25 mx-auto">
          <h1
            className="text-4xl font-semibold tracking-wide cursor-pointer hover:text-white/90 transition-colors"
            onClick={() => router.push('/')}
          >
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
