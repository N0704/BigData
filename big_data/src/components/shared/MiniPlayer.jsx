'use client';

import { X, Play, Pause, Volume2 } from 'lucide-react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { decodeHtml } from '@/lib/utils';

export default function MiniPlayer() {
    const {
        currentArticle,
        status,
        pause,
        resume,
        stop,
    } = useAudioPlayer();

    if (!currentArticle) return null;

    const togglePlay = () => {
        if (status === 'playing') {
            pause();
        } else {
            resume();
        }
    };

    /* ================= PROGRESS ================= */
    const progressAnim =
        status === 'playing'
            ? 'animate-[progress_120s_linear_forwards]'
            : status === 'paused'
                ? 'animate-none'
                : 'w-0';

    /* ================= UI ================= */
    return (
        <div className="fixed bottom-2 right-4 z-50 w-[420px] rounded-2xl bg-white shadow-[0_10px_40px_rgba(0,0,0,0.15)] overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-4 fade-in duration-300">
            {/* Content */}
            <div className="flex gap-4 p-4">
                {/* Thumbnail */}
                <div className="relative w-44 h-[100px] shrink-0 rounded-xl overflow-hidden bg-gray-900">
                    {currentArticle.image_url ? (
                        <img
                            src={currentArticle.image_url}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Volume2 />
                        </div>
                    )}

                    {/* Overlay */}
                    <button
                        onClick={togglePlay}
                        className="absolute inset-0 flex items-center justify-center
                       bg-black/40 opacity-0 hover:opacity-100 transition duration-200"
                    >
                        <div className="px-2 py-2 flex items-center justify-center shadow-lg transform scale-90 hover:scale-100 transition duration-200">
                            {status === 'playing' ? (
                                <Pause className="text-white w-6 h-6" />
                            ) : (
                                <Play className="text-white w-6 h-6" />
                            )}
                        </div>
                    </button>
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">
                            {decodeHtml(currentArticle.title)}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                            {currentArticle.source}
                        </p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-3 mt-3 text-gray-900">
                        <button
                            onClick={togglePlay}
                            className="p-2 rounded-full hover:bg-gray-100 active:scale-95 transition"
                        >
                            {status === 'playing' ? <Pause size={18} /> : <Play size={18} />}
                        </button>

                        {/* Volume/Progress indicator */}
                        <div className="flex items-center gap-2 flex-1">
                            <Volume2 size={16} className="text-gray-500" />
                            <div className="h-1 flex-1 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full bg-linear-to-r from-gray-500 to-gray-700 transition-all duration-500
                    ${status === 'playing' ? 'w-2/3' : 'w-1/3'}`}
                                />
                            </div>
                        </div>

                        <button
                            onClick={stop}
                            className="p-2 rounded-full hover:bg-gray-100 transition"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-1 bg-gray-200">
                <div
                    className={`absolute inset-y-0 left-0 bg-linear-to-r from-red-500 to-[#ff2d2d] ${progressAnim}`}
                />
            </div>
        </div>
    );
}
