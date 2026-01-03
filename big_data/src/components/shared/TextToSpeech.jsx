'use client';

import { useAudioPlayer } from '@/contexts/AudioPlayerContext';

export default function TextToSpeech({ newsId, article, className = '', onPlayStart }) {
    const {
        currentArticle,
        status,
        play,
        pause,
        resume,
    } = useAudioPlayer();

    const isCurrentArticle = currentArticle?.news_id === newsId || currentArticle?.id === newsId;

    const handleClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isCurrentArticle) {
            if (status === 'playing') {
                pause();
            } else if (status === 'paused') {
                resume();
            } else {
                play(article || { news_id: newsId, id: newsId });
            }
            return;
        }

        // Start new article
        if (onPlayStart) onPlayStart();
        play(article || { news_id: newsId, id: newsId });
    };

    return (
        <button
            onClick={handleClick}
            title={isCurrentArticle && status === 'playing' ? 'Tạm dừng' : isCurrentArticle && status === 'paused' ? 'Tiếp tục' : 'Nghe tin'}
            className={`p-2 rounded-full transition-all ${isCurrentArticle && (status === 'playing' || status === 'paused')
                ? 'bg-red-50 text-red-500'
                : 'text-gray-400 hover:bg-gray-100 hover:text-red-500'
                } ${className}`}
        >
            {isCurrentArticle && status === 'loading' ? (
                <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            ) : isCurrentArticle && status === 'playing' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
            ) : isCurrentArticle && status === 'paused' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
            ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 5L6 9H2V15H6L11 19V5Z" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
            )}
        </button>
    );
}
