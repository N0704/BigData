"use client";

import { useState, useEffect, useRef } from "react";
import NewsCard from "./NewsCard";
import { getLatestNews, getNewsByCategorySlug, getNewsByClusterId, getHotClusters } from "@/lib/actions/news";

const NewsFeed = ({ initialNews = [], categorySlug = null, clusterId = null }) => {
    const [news, setNews] = useState(initialNews);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const loader = useRef(null);

    // Reset and load data when category changes
    useEffect(() => {
        const loadCategoryNews = async () => {
            setLoading(true);
            try {
                let freshNews;
                if (clusterId) {
                    freshNews = await getNewsByClusterId(clusterId, 1);
                } else if (categorySlug === 'latest') {
                    freshNews = await getLatestNews(1);
                } else if (categorySlug) {
                    freshNews = await getNewsByCategorySlug(categorySlug, 1);
                } else {
                    freshNews = await getHotClusters(20, 0);
                }
                setNews(freshNews);
                setPage(1);
                setHasMore(freshNews.length >= 20);
            } catch (error) {
                console.error("Error loading category news:", error);
                setNews([]);
            } finally {
                setLoading(false);
            }
        };

        // Only load if we don't have initial data or if params changed
        // Actually, to keep it simple and fix the bug, we just ensure we fetch the right thing.
        // Optimization: check if initialNews is already populated and matches the current context.
        // But for now, just fixing the logic error.
        loadCategoryNews();
    }, [categorySlug, clusterId]);

    const loadMore = async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const nextPage = page + 1;
            let newNews;

            if (clusterId) {
                newNews = await getNewsByClusterId(clusterId, nextPage);
            } else if (categorySlug === 'latest') {
                newNews = await getLatestNews(nextPage);
            } else if (categorySlug) {
                newNews = await getNewsByCategorySlug(categorySlug, nextPage);
            } else {
                newNews = await getHotClusters(20, (nextPage - 1) * 20);
            }

            if (newNews.length === 0) {
                setHasMore(false);
            } else {
                setNews((prev) => [...prev, ...newNews]);
                setPage(nextPage);
            }
        } catch (error) {
            console.error("Error loading more news:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { threshold: 0.2 }
        );

        if (loader.current) {
            observer.observe(loader.current);
        }

        return () => {
            if (loader.current) {
                observer.unobserve(loader.current);
            }
        };
    }, [loading, hasMore, categorySlug, clusterId]);

    return (
        <div className="flex flex-col">
            {news.map((article, index) => (
                <NewsCard key={`${article.news_id}-${index}`} article={article} />
            ))}

            {hasMore && (
                <div ref={loader} className="py-4 text-sm text-center text-gray-500 min-h-[40px]">
                    {loading ? "Đang tải..." : ""}
                </div>
            )}
        </div>
    );
};

export default NewsFeed;
