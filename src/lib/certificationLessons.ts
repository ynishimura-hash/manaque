export type LessonType = 'video' | 'quiz';

export interface LessonData {
    id: string;
    title: string;
    type: LessonType;
    exp: number;
    duration: string;
    thumbnail?: string;
}

export const CERTIFICATION_LESSONS: LessonData[] = [
    { id: 'lesson1', title: '販売士の役割と心構え', type: 'video', exp: 50, duration: '2:30', thumbnail: '/images/lessons/lesson1-1.png' },
    { id: 'lesson2', title: 'マーケティングの基礎', type: 'video', exp: 50, duration: '3:15', thumbnail: '/images/lessons/lesson2-1.png' },
    { id: 'lesson3', title: 'ストアオペレーション', type: 'video', exp: 50, duration: '2:45', thumbnail: '/images/lessons/lesson3-1.png' },
    { id: 'lesson4', title: '商品知識', type: 'video', exp: 50, duration: '3:00', thumbnail: '/images/lessons/lesson4-1.png' },
    { id: 'lesson5', title: '接客サービス', type: 'video', exp: 50, duration: '2:50', thumbnail: '/images/lessons/lesson5-1.png' },
    { id: 'quiz1', title: '販売士3級 模擬テスト', type: 'quiz', exp: 100, duration: '10問' },
];
