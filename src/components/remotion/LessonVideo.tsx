"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { useCurrentFrame, interpolate, Audio, staticFile, Sequence, Img, useVideoConfig } from 'remotion';
import { Input, ALL_FORMATS, UrlSource } from 'mediabunny';

export type SceneData = {
    text: string;
    imageSrc: string;
};

export const lessonContents: Record<string, { title: string, scenes: SceneData[] }> = {
    'lesson1': {
        title: '販売士の役割と心構え',
        scenes: [
            { text: '販売士は、単に商品を売るだけではありません。顧客のニーズを的確に読み取り、最適な提案を行う...', imageSrc: 'images/lessons/lesson1-1.png' },
            { text: '店舗や流通のプロフェッショナルです。常に顧客の視点に立ち、何を求めているのかを想像することが重要です。', imageSrc: 'images/lessons/lesson1-2.png' },
            { text: '単なる笑顔の接客にとどまらず、顧客の真の課題解決に寄り添う提案力が求められます。', imageSrc: 'images/lessons/lesson1-3.png' }
        ]
    },
    'lesson2': {
        title: 'マーケティングの基礎',
        scenes: [
            { text: 'マーケティングの基礎は、市場のニーズを調査し、どのような商品が求められているのかを分析することから始まります。', imageSrc: 'images/lessons/lesson2-1.png' },
            { text: 'これが販売戦略の第一歩です。データを活用し、自社の強みを活かせる市場を見つけ出します。', imageSrc: 'images/lessons/lesson2-2.png' },
            { text: 'そのうえで、ターゲットとなる顧客層を明確にし、効果的なアプローチを設計しましょう。', imageSrc: 'images/lessons/lesson2-3.png' }
        ]
    },
    'lesson3': {
        title: 'ストアオペレーション',
        scenes: [
            { text: 'ストアオペレーションとは、店舗運営を円滑に効率よく行うための基本原則と日々の業務のことです。', imageSrc: 'images/lessons/lesson3-1.png' },
            { text: '適切な商品の発注から始まり、欠品を防ぎつつ過剰在庫を持たない緻密な在庫管理の徹底が求められます。', imageSrc: 'images/lessons/lesson3-2.png' },
            { text: 'また、清掃や売場づくりなど、お客様が快適に買い物できる環境を常に維持することも重要な業務です。', imageSrc: 'images/lessons/lesson3-3.png' }
        ]
    },
    'lesson4': {
        title: '商品知識',
        scenes: [
            { text: '扱う商品の価値をお客様に正確に魅力的に伝えるため、販売員にとって深い商品知識は絶対に不可欠な武器となります。', imageSrc: 'images/lessons/lesson4-1.png' },
            { text: '商品の表面的な材質や基本的な機能にとどまらず、競合他社製品との違いや強みも把握しておく必要があります。', imageSrc: 'images/lessons/lesson4-2.png' },
            { text: '幅広い知識を持つことで、お客様からの様々な質問に自信を持って答え、信頼を勝ち取ることができます。', imageSrc: 'images/lessons/lesson4-3.png' }
        ]
    },
    'lesson5': {
        title: '接客サービス',
        scenes: [
            { text: '接客サービスにおける最終的な目標は、お客様に「またこのお店に来たい」と心から思ってもらえるような体験を提供することです。', imageSrc: 'images/lessons/lesson5-1.png' },
            { text: 'お客様が来店された際の明るく元気な挨拶からアプローチを始め、適切な距離感を保ちながらニーズを引き出します。', imageSrc: 'images/lessons/lesson5-2.png' },
            { text: '購入後のお見送りに至るまで、一つ一つの行動に心を込め、最高の満足感を提供できるよう努めましょう。', imageSrc: 'images/lessons/lesson5-3.png' }
        ]
    },
};

// Remotion Component
export const LessonVideoComp: React.FC<{ lessonId: string }> = ({ lessonId }) => {
    const frame = useCurrentFrame();
    const { durationInFrames, fps } = useVideoConfig();

    const data = lessonContents[lessonId] || { title: '準備中', scenes: [{ text: '', imageSrc: '' }] };

    // Calculate timings (divide total duration by number of scenes)
    const sceneCount = data.scenes.length;
    // Base duration for static rendering context where duration isn't available from Player.
    // In actual render, we might need a fixed fallback or pass it differently.
    // Let's assume ~60s total for now as fallback, or use frame math.
    const approximateDurationFrames = durationInFrames > 30 ? durationInFrames : 30 * 60; // fallback 60s
    const framesPerScene = Math.floor(approximateDurationFrames / sceneCount);

    const currentSceneIndex = Math.min(Math.floor(frame / framesPerScene), sceneCount - 1);
    const currentScene = data.scenes[currentSceneIndex];

    // Animations (Fade in for title and content, image slow zoom)
    const titleOpacity = interpolate(Math.max(frame - 15, 0), [0, 30], [0, 1], { extrapolateRight: 'clamp' });
    const titleTranslateY = interpolate(Math.max(frame - 15, 0), [0, 30], [50, 0], { extrapolateRight: 'clamp' });

    // Per-scene animation logic
    const sceneFrame = frame % framesPerScene;
    const isFirstScene = currentSceneIndex === 0;

    // Content fade in for each scene
    const contentOpacity = isFirstScene
        ? interpolate(Math.max(sceneFrame - 60, 0), [0, 30], [0, 1], { extrapolateRight: 'clamp' })
        : interpolate(sceneFrame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

    const contentTranslateY = isFirstScene
        ? interpolate(Math.max(sceneFrame - 60, 0), [0, 30], [30, 0], { extrapolateRight: 'clamp' })
        : interpolate(sceneFrame, [0, 20], [10, 0], { extrapolateRight: 'clamp' });

    // Reset image scale for each scene to give a fresh zoom effect
    const imageScale = interpolate(sceneFrame, [0, framesPerScene], [1, 1.15], { extrapolateRight: 'clamp' });

    return (
        <div style={{
            flex: 1,
            backgroundColor: '#0f172a', // Dark theme background
            display: 'flex',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Image with Ken Burns effect transition per scene */}
            {currentScene.imageSrc && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    transform: `scale(${imageScale})`,
                    transformOrigin: 'center center',
                    zIndex: 0
                }}>
                    <Img
                        src={staticFile(currentScene.imageSrc)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
                        onError={(e) => {
                            // Fallback to original image if per-scene image is missing
                            const target = e.target as HTMLImageElement;
                            if (!target.src.includes('lesson' + lessonId.replace('lesson', '') + '.png')) {
                                target.src = `/images/lessons/${lessonId}.png`;
                            }
                        }}
                    />
                </div>
            )}

            {/* Gradient Overlay for text readability */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                background: 'linear-gradient(to right, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.7) 40%, rgba(15, 23, 42, 0.1) 100%)',
                zIndex: 1
            }} />

            {/* Content Container */}
            <div style={{
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '80px 120px',
                width: '65%',
                height: '100%'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                    <div style={{ width: '80px', height: '6px', backgroundColor: '#3b82f6', borderRadius: '3px', opacity: titleOpacity }} />
                    <span style={{ color: '#94a3b8', fontSize: '32px', fontWeight: 'bold', letterSpacing: '4px', opacity: titleOpacity }}>CHAPTER</span>
                </div>

                <h1 style={{
                    fontSize: '76px',
                    color: '#ffffff',
                    fontWeight: 900,
                    marginBottom: '50px',
                    opacity: titleOpacity,
                    transform: `translateY(${titleTranslateY}px)`,
                    textShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}>
                    {data.title}
                </h1>

                {/* Subtitle / Content Area */}
                <div style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(16px)',
                    padding: '50px',
                    borderRadius: '24px',
                    borderLeft: '8px solid #3b82f6',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    opacity: contentOpacity,
                    transform: `translateY(${contentTranslateY}px)`,
                    minHeight: '200px', // Prevent jitter when text changes
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <p style={{
                        fontSize: '42px',
                        lineHeight: 1.6,
                        color: '#f8fafc',
                        fontWeight: '700',
                        textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                    }}>
                        {currentScene.text}
                    </p>
                </div>
            </div>

            {/* Audio integration */}
            <Audio src={staticFile(`audio/voice/${lessonId}.wav`)} volume={1} />
            <Audio src={staticFile(`audio/bgm/bgm.mp3`)} volume={0.15} loop />
        </div>
    );
};

export function LessonVideoPlayer({ lessonId, onVideoComplete, playbackRate = 1.0 }: { lessonId: string, onVideoComplete?: () => void, playbackRate?: number }) {
    const [durationFrames, setDurationFrames] = useState<number | null>(null);
    const playerRef = useRef<PlayerRef>(null);
    const hasCompletedRef = useRef(false);
    const fps = 30;

    useEffect(() => {
        const fetchDuration = async () => {
            try {
                // Fetch audio duration dynamically
                const input = new Input({
                    formats: ALL_FORMATS,
                    source: new UrlSource(`/audio/voice/${lessonId}.wav`, {
                        getRetryDelay: () => null,
                    }),
                });
                const durationInSeconds = await input.computeDuration();
                // We add a few seconds of buffer after voice finishes
                setDurationFrames(Math.ceil(durationInSeconds * fps) + (fps * 2));
            } catch (error) {
                console.error("Failed to load audio duration:", error);
                setDurationFrames(fps * 60); // Default fallback: 60 seconds
            }
        };
        fetchDuration();
        hasCompletedRef.current = false; // Reset complete state on new video
    }, [lessonId]);

    const handleFrameUpdate = useCallback(() => {
        if (!playerRef.current || !durationFrames || !onVideoComplete || hasCompletedRef.current) return;

        const currentFrame = playerRef.current.getCurrentFrame();
        // If current frame is very close to the end, trigger completion
        if (currentFrame >= durationFrames - (fps / 2)) {
            hasCompletedRef.current = true;
            onVideoComplete();
        }
    }, [durationFrames, onVideoComplete, fps]);

    useEffect(() => {
        if (playerRef.current) {
            const id = setInterval(handleFrameUpdate, 100);
            return () => clearInterval(id);
        }
    }, [handleFrameUpdate]);

    if (!durationFrames) {
        return <div className="w-full h-full flex items-center justify-center text-white font-bold animate-pulse">動画データを読み込み中...</div>;
    }

    return (
        <Player
            ref={playerRef}
            component={LessonVideoComp}
            inputProps={{ lessonId }}
            durationInFrames={durationFrames}
            compositionWidth={1920}
            compositionHeight={1080}
            fps={fps}
            controls
            autoPlay
            playbackRate={playbackRate}
            style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#0f172a' }}
        />
    );
}
