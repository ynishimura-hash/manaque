"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";

interface YouTubePlayerProps {
    url: string | null;
    onEnded?: () => void;
    onProgress?: (percent: number) => void;
}

function getYouTubeId(url: string): string | null {
    const match = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^#&?\s]+)/
    );
    return match ? match[1] : null;
}

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: (() => void) | undefined;
    }
}

let apiLoaded = false;
let apiReady = false;
const readyCallbacks: (() => void)[] = [];

function loadYouTubeAPI(): Promise<void> {
    return new Promise((resolve) => {
        if (apiReady) {
            resolve();
            return;
        }
        readyCallbacks.push(resolve);
        if (apiLoaded) return;
        apiLoaded = true;

        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);

        window.onYouTubeIframeAPIReady = () => {
            apiReady = true;
            readyCallbacks.forEach((cb) => cb());
            readyCallbacks.length = 0;
        };
    });
}

export default function YouTubePlayer({ url, onEnded, onProgress }: YouTubePlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [noVideo, setNoVideo] = useState(false);

    const videoId = url ? getYouTubeId(url) : null;

    const startTracking = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            const p = playerRef.current;
            if (!p || !p.getDuration) return;
            const duration = p.getDuration();
            const current = p.getCurrentTime();
            if (duration > 0 && onProgress) {
                onProgress(Math.round((current / duration) * 100));
            }
        }, 5000);
    }, [onProgress]);

    useEffect(() => {
        if (!videoId) {
            setNoVideo(true);
            return;
        }
        setNoVideo(false);

        let mounted = true;
        loadYouTubeAPI().then(() => {
            if (!mounted || !containerRef.current) return;

            // Clear previous player
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }

            const div = document.createElement("div");
            containerRef.current.innerHTML = "";
            containerRef.current.appendChild(div);

            playerRef.current = new window.YT.Player(div, {
                videoId,
                width: "100%",
                height: "100%",
                playerVars: {
                    autoplay: 1,
                    modestbranding: 1,
                    rel: 0,
                    playsinline: 1,
                },
                events: {
                    onStateChange: (event: any) => {
                        if (event.data === 1) {
                            // playing
                            startTracking();
                        }
                        if (event.data === 0) {
                            // ended
                            if (onProgress) onProgress(100);
                            if (onEnded) onEnded();
                            if (intervalRef.current) clearInterval(intervalRef.current);
                        }
                    },
                },
            });
        });

        return () => {
            mounted = false;
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, [videoId, onEnded, onProgress, startTracking]);

    if (noVideo) {
        return (
            <div className="w-full aspect-video bg-slate-800 flex items-center justify-center rounded-xl">
                <div className="text-center text-slate-400">
                    <p className="text-lg font-bold mb-1">動画準備中</p>
                    <p className="text-sm">YouTube URLが設定されていません</p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="w-full aspect-video bg-black rounded-xl overflow-hidden"
        />
    );
}
