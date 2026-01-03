'use client';

import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { getNewsContent } from '@/lib/actions/news';

const AudioPlayerContext = createContext();

export function AudioPlayerProvider({ children }) {
    const [currentArticle, setCurrentArticle] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, loading, playing, paused
    const [content, setContent] = useState(null);
    const utteranceRef = useRef(null);
    const chunksRef = useRef([]);
    const currentChunkIndexRef = useRef(0);

    const [voicesLoaded, setVoicesLoaded] = useState(false);

    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) setVoicesLoaded(true);
        };
        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    const getVietnameseVoice = useCallback(() => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return null;
        const voices = window.speechSynthesis.getVoices();
        return (
            voices.find(v => v.lang === 'vi-VN' && v.name.includes('Google')) ||
            voices.find(v => v.lang === 'vi-VN') ||
            voices.find(v => v.lang.startsWith('vi'))
        );
    }, []);

    const cleanText = useCallback((html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
    }, []);

    const splitIntoChunks = useCallback((text) => {
        const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
        const chunks = [];
        let buffer = '';

        sentences.forEach(s => {
            if ((buffer + s).length < 160) buffer += s;
            else {
                if (buffer) chunks.push(buffer.trim());
                buffer = s;
            }
        });
        if (buffer) chunks.push(buffer.trim());
        return chunks.filter(c => c.length > 0);
    }, []);

    const playNextChunk = useCallback(() => {
        if (currentChunkIndexRef.current >= chunksRef.current.length) {
            setStatus('idle');
            return;
        }

        const text = chunksRef.current[currentChunkIndexRef.current];
        const utterance = new SpeechSynthesisUtterance(text);

        utterance.lang = 'vi-VN';
        const voice = getVietnameseVoice();
        if (voice) utterance.voice = voice;

        utterance.onend = () => {
            currentChunkIndexRef.current++;
            playNextChunk();
        };

        utterance.onerror = () => {
            setStatus('idle');
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, [getVietnameseVoice]);

    const play = useCallback(async (article) => {
        if (!window.speechSynthesis) return;

        // If same article and paused, resume
        if (currentArticle?.id === article.id && status === 'paused') {
            window.speechSynthesis.resume();
            setStatus('playing');
            return;
        }

        // Start new article
        setStatus('loading');
        setCurrentArticle(article);

        try {
            const data = await getNewsContent(article.news_id || article.id);
            if (!data?.content) throw new Error('No content');

            const text = cleanText(data.content);
            setContent(text);

            window.speechSynthesis.cancel();

            setTimeout(() => {
                chunksRef.current = splitIntoChunks(text);
                currentChunkIndexRef.current = 0;
                setStatus('playing');
                playNextChunk();
            }, 100);
        } catch (err) {
            console.error("TTS Error:", err);
            setStatus('idle');
            setCurrentArticle(null);
        }
    }, [currentArticle, status, cleanText, splitIntoChunks, playNextChunk]);

    const pause = useCallback(() => {
        if (window.speechSynthesis) {
            window.speechSynthesis.pause();
            setStatus('paused');
        }
    }, []);

    const resume = useCallback(() => {
        if (window.speechSynthesis) {
            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
                setStatus('playing');
            } else {
                playNextChunk();
            }
        }
    }, [playNextChunk]);

    const stop = useCallback(() => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setStatus('idle');
        setCurrentArticle(null);
        setContent(null);
        chunksRef.current = [];
        currentChunkIndexRef.current = 0;
    }, []);

    const value = {
        currentArticle,
        status,
        content,
        play,
        pause,
        resume,
        stop,
        utteranceRef,
        chunksRef,
        currentChunkIndexRef,
    };

    return (
        <AudioPlayerContext.Provider value={value}>
            {children}
        </AudioPlayerContext.Provider>
    );
}

export function useAudioPlayer() {
    const context = useContext(AudioPlayerContext);
    if (!context) {
        throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
    }
    return context;
}
