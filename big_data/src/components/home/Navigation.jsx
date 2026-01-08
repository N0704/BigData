"use client";

import { ChevronDown } from "lucide-react";

const Navigation = ({
  categories = [],
  activeSlug = null,
  onCategoryChange,
  className = "",
  listClassName = "justify-between",
}) => {
  const firstThree = categories.slice(0, 3);
  const others = categories.slice(3);
  const activeInOthers = others.find((c) => c.slug === activeSlug);
  const fourthCategory = activeInOthers || categories[3];
  const displayCategories = fourthCategory
    ? [...firstThree, fourthCategory]
    : firstThree;

  const navItems = [
    { id: "latest", label: "Mới nhất", dot: true, slug: "latest" },
    { id: "recommend", label: "Đề xuất", slug: null },
    ...displayCategories.map((c) => ({
      id: c.id,
      slug: c.slug,
      label: c.name,
    })),
  ];

  const moreItems = categories.filter(
    (c) => !displayCategories.find((dc) => dc.slug === c.slug)
  );

  const handleCategoryClick = (slug) => {
    if (onCategoryChange) {
      onCategoryChange(slug);
    }
  };

  return (
    <nav className={className}>
      <ul className={`flex flex-row items-center ${listClassName}`}>
        {navItems.map((item) => (
          <li className="relative" key={item.id}>
            <button
              onClick={() => handleCategoryClick(item.slug)}
              className={`py-1 cursor-pointer relative ${
                (item.id === "recommend" && !activeSlug) ||
                (item.slug && item.slug === activeSlug)
                  ? "text-[#ff2d2d]"
                  : "hover:text-black hover:opacity-60"
              }`}
            >
              {item.label}

              {/* chấm đỏ Quan tâm */}
              {item.dot && (
                <span className="absolute top-1 -right-1.5 w-1 h-1 bg-red-500 rounded-full" />
              )}
            </button>
          </li>
        ))}

        <li className="relative group">
          <div className="flex items-center gap-1 cursor-pointer hover:opacity-60 select-none">
            Thêm
            <ChevronDown className="w-4 h-4 mt-0.5 transition-transform group-hover:rotate-180" />
          </div>
          <div className="absolute inset-x-0 top-full w-full pb-4"></div>
          <div
            className="
            absolute top-full right-0
            w-80 mt-3
            bg-white rounded-lg
            shadow-[0_10px_50px_rgba(0,0,0,0.08)]
            py-4 pl-6 pr-4
            grid grid-cols-3 gap-x-8 gap-y-3
            z-60 text-[15px]
            opacity-0 invisible
            group-hover:opacity-100 group-hover:visible
            transition-opacity duration-150
          "
          >
            {moreItems.map((item) => (
              <button
                key={item.slug}
                onClick={() => handleCategoryClick(item.slug)}
                className={`whitespace-nowrap text-left ${
                  item.slug === activeSlug
                    ? "text-[#ff2d2d]"
                    : "hover:text-[#ff2d2d]"
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </li>
      </ul>
    </nav>
  );
};

export default Navigation;
