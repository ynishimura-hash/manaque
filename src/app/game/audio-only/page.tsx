"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Pause, SkipForward, SkipBack, Home, Volume2, ListVideo } from 'lucide-react';
import { useGamificationStore } from '@/store/useGamificationStore';

// 音声再生リスト（実際のVoiceVox生成音声ファイルを参照するモック）
// publicフォルダ内に格納されている想定
const AUDIO_PLAYLIST = [
    { id: 'track1', title: '1. 販売士の役割と心構え', url: '/audio/lesson1_voice.wav', duration: '1:00' },
    { id: 'track2', title: '2. マーケティングの基礎（4P）', url: '/audio/lesson2_voice.wav', duration: '1:02' },
    { id: 'track3', title: '3. ストアオペレーション', url: '/audio/lesson3_voice.wav', duration: '0:58' },
    { id: 'track4', title: '4. 商品知識・在庫管理', url: '/audio/lesson4_voice.wav', duration: '1:05' },
    { id: 'track5', title: '5. 接客サービスとマナー', url: '/audio/lesson5_voice.wav', duration: '1:10' },
];

export default function AudioOnlyPage() {
    const router = useRouter();
    const { addExp } = useGamificationStore();

    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0); // 0-100
    const [showPlaylist, setShowPlaylist] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    const currentTrack = AUDIO_PLAYLIST[currentTrackIndex];

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.src = currentTrack.url;
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Audio play failed:", e));
            }
        }
    }, [currentTrack.url]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(e => console.error("Audio play failed:", e));
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleNext = () => {
        if (currentTrackIndex < AUDIO_PLAYLIST.length - 1) {
            setCurrentTrackIndex(prev => prev + 1);
            setProgress(0);
        }
    };

    const handlePrev = () => {
        if (currentTrackIndex > 0) {
            setCurrentTrackIndex(prev => prev - 1);
            setProgress(0);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const current = audioRef.current.currentTime;
            const duration = audioRef.current.duration;
            if (duration > 0) {
                setProgress((current / duration) * 100);
            }
        }
    };

    const handleEnded = () => {
        // トラック完了で経験値10
        addExp(10);
        if (currentTrackIndex < AUDIO_PLAYLIST.length - 1) {
            handleNext();
        } else {
            setIsPlaying(false);
            setProgress(100);
        }
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (audioRef.current && e.currentTarget) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = x / rect.width;
            audioRef.current.currentTime = percentage * audioRef.current.duration;
            setProgress(percentage * 100);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col p-4 md:p-8 font-sans">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 transition"
                >
                    <Home size={20} />
                </button>
                <div className="text-sm font-black tracking-widest uppercase text-slate-400">Podcast Learning</div>
                <button
                    onClick={() => setShowPlaylist(!showPlaylist)}
                    className={`p-3 rounded-full transition ${showPlaylist ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                >
                    <ListVideo size={20} />
                </button>
            </header>

            {/* Main Player Area */}
            <main className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full relative">

                {/* Artwork Placeholder (CD Jacket style) */}
                <div className="w-64 h-64 md:w-80 md:h-80 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-3xl shadow-2xl flex items-center justify-center mb-10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20" />
                    <Volume2 size={80} className={`text-white/50 ${isPlaying ? 'animate-pulse' : ''}`} />

                    {/* Ripple effects for playing state */}
                    {isPlaying && (
                        <>
                            <div className="absolute w-full h-full rounded-3xl border border-white/20 scale-110 animate-ping" style={{ animationDuration: '3s' }} />
                            <div className="absolute w-full h-full rounded-3xl border border-white/10 scale-125 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                        </>
                    )}
                </div>

                {/* Track Info */}
                <div className="text-center w-full mb-8">
                    <p className="text-emerald-400 text-sm font-black tracking-widest uppercase mb-2">Track {currentTrackIndex + 1} of {AUDIO_PLAYLIST.length}</p>
                    <h2 className="text-2xl font-black mb-1 line-clamp-1">{currentTrack.title}</h2>
                    <p className="text-slate-400 text-sm font-bold">資格勉強プレイリスト</p>
                </div>

                {/* Progress Bar */}
                <div className="w-full mb-8">
                    <div
                        className="w-full h-2 bg-slate-700 rounded-full cursor-pointer relative overflow-hidden"
                        onClick={handleProgressClick}
                    >
                        <div
                            className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all duration-100 ease-linear"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    {/* Time UI would go here if we tracked current time string */}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-6 w-full px-4">
                    <button
                        onClick={handlePrev}
                        disabled={currentTrackIndex === 0}
                        className="p-4 text-slate-400 hover:text-white disabled:opacity-30 transition"
                    >
                        <SkipBack size={32} />
                    </button>

                    <button
                        onClick={togglePlay}
                        className="w-20 h-20 bg-emerald-500 hover:bg-emerald-400 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 transition-transform active:scale-95"
                    >
                        {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-2" />}
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={currentTrackIndex === AUDIO_PLAYLIST.length - 1}
                        className="p-4 text-slate-400 hover:text-white disabled:opacity-30 transition"
                    >
                        <SkipForward size={32} />
                    </button>
                </div>
            </main>

            {/* Hidden Audio Element */}
            <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
            />

            {/* Playlist Overlay Drawer */}
            {showPlaylist && (
                <div className="absolute inset-x-0 bottom-0 bg-slate-800 rounded-t-[2.5rem] p-6 shadow-2xl pb-10 border-t border-slate-700 animate-in slide-in-from-bottom max-h-[60vh] overflow-y-auto">
                    <h3 className="text-lg font-black mb-4 px-2">Up Next</h3>
                    <div className="space-y-2">
                        {AUDIO_PLAYLIST.map((track, idx) => (
                            <div
                                key={track.id}
                                onClick={() => {
                                    setCurrentTrackIndex(idx);
                                    setProgress(0);
                                    setIsPlaying(true);
                                    setShowPlaylist(false);
                                }}
                                className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition ${idx === currentTrackIndex ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-slate-700/50 text-slate-300'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-8 flex justify-center font-bold text-slate-500">
                                        {idx === currentTrackIndex && isPlaying ? <Volume2 size={16} className="text-emerald-400 animate-pulse" /> : idx + 1}
                                    </div>
                                    <span className="font-bold line-clamp-1">{track.title}</span>
                                </div>
                                <span className="text-xs font-bold text-slate-500">{track.duration}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
