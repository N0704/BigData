'use client';

import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import MiniPlayer from "@/components/shared/MiniPlayer";

export default function ClientProviders({ children }) {
    return (
        <AudioPlayerProvider>
            {children}
            <MiniPlayer />
        </AudioPlayerProvider>
    );
}
