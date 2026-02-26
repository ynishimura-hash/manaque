const fs = require('fs');
const path = require('path');
const http = require('http');

// 1分程度の長尺テキストデータ（約270〜300文字/話） - LessonVideoと同期
const lessons = {
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

const VOICEVOX_URL = 'http://localhost:50021';
const SPEAKER_ID = 13; // 青山龍星 (ノーマル)

const outputDir = path.join(__dirname, '../public/audio/voice');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

async function generateAudio(text, filename) {
    try {
        console.log(`Generating audio for ${filename} (青山龍星)...`);
        // 1. AudioQueryの作成
        const queryUrl = new URL(`${VOICEVOX_URL}/audio_query`);
        queryUrl.searchParams.append('text', text);
        queryUrl.searchParams.append('speaker', SPEAKER_ID);

        const queryResponse = await fetch(queryUrl, { method: 'POST' });
        if (!queryResponse.ok) throw new Error(`query API error: ${queryResponse.status}`);
        const queryJson = await queryResponse.json();

        // speedScale を1分に合わせて少し調整する場合（基本のまま）
        queryJson.speedScale = 1.0;

        // 2. 音声合成 (synthesis)
        const synthUrl = new URL(`${VOICEVOX_URL}/synthesis`);
        synthUrl.searchParams.append('speaker', SPEAKER_ID);

        const synthResponse = await fetch(synthUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(queryJson)
        });

        if (!synthResponse.ok) throw new Error(`synthesis API error: ${synthResponse.status}`);

        // 3. WAVファイルとして保存
        const arrayBuffer = await synthResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(path.join(outputDir, filename), buffer);
        console.log(`✅ Saved ${filename}`);

    } catch (error) {
        console.error(`❌ Failed to generate audio for ${filename}:`, error.message);
    }
}

async function main() {
    console.log('VOICEVOXを利用して長尺の音声を生成します...');
    try {
        const res = await fetch(`${VOICEVOX_URL}/speakers`);
        if (!res.ok) throw new Error('API invalid');
    } catch (e) {
        console.error('⚠️ VOICEVOXエンジンに接続できません。VOICEVOXが起動しているか確認してください (http://localhost:50021)');
        process.exit(1);
    }

    for (const [id, data] of Object.entries(lessons)) {
        const fullText = data.scenes.map(s => s.text).join(' '); // シーンのテキストを結合
        await generateAudio(fullText, `${id}.wav`);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('🎉 すべての長尺音声（青山龍星）の生成が完了しました！');
}

main();
