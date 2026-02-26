// src/config/features.ts

/**
 * ゲーミフィケーション・モチベーション向上に関連する全追加機能のOn/Offフラグ
 * ここを false に変更するだけで、UI上から該当する機能が完全に隠蔽・無効化されます。
 */
export const FEATURES = {
    // 1. 学習の習慣化サポート
    STREAK_BONUS: true,               // 連続ログイン日数（ストリーク）の記録とボーナス
    LEARNING_HEATMAP: true,           // カレンダー型の学習履歴（草生やし）グラフ

    // 2. 反復学習・復習システム
    DAILY_QUIZ: true,                 // 1日1回のランダム出題（デイリークイズ）
    WEAKNESS_OVERCOME: true,          // 間違えた問題のストック・再挑戦機能

    // 3. 腕試しとコレクション要素
    MOCK_EXAM_TIME_ATTACK: true,      // タイムアタック型の模擬試験モード
    BADGE_SYSTEM: true,               // 条件達成によるバッジ・称号コレクション

    // 4. 学習の利便性向上
    AUDIO_ONLY_MODE: true,            // 動画を音声だけでバックグラウンド再生するポッドキャストモード
};

export type FeatureKey = keyof typeof FEATURES;

export const isFeatureEnabled = (key: FeatureKey): boolean => {
    return FEATURES[key];
};
