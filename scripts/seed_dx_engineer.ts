import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const CURRICULUM_DATA = {
    track: {
        title: '社内DX推進エンジニア養成コース',
        description: '非エンジニア・文系社員が、ITの武器を手に入れ、現場の課題を自ら解決できる「DXの旗振り役」になるためのステップアップコース。',
        category: 'Track',
        level: 'Bootcamp'
    },
    modules: [
        {
            title: 'モジュール1：DXマインドセットと業務の可視化',
            description: 'ツールに走る前に「何を解決すべきか」を定義する力を養います。業務フローの作成や課題発見のフレームワークを学びます。',
            lessons: [
                { title: 'DXの真意：単なるデジタル化と何が違うのか', url: 'https://www.youtube.com/watch?v=EPrvQQ5_m6M', duration: '15:00' },
                { title: '業務フロー図（BPMN）の書き方と課題発見', url: 'https://www.youtube.com/watch?v=xwitLwTKl4E', duration: '20:00' }
            ]
        },
        {
            title: 'モジュール2：ノーコード・ローコードによる自動化',
            description: 'プログラミングなしで「今すぐ」効果を出す技術を学びます。iPaaSやノーコードDBの基礎を習得します。',
            lessons: [
                { title: 'iPaaS（Power Automate/Zapier）による自動化入門', url: 'https://www.youtube.com/watch?v=HgFP79PRPVQ', duration: '25:00' },
                { title: '生成AIを実務で使い倒すプロンプト術', url: 'https://www.youtube.com/watch?v=srzfgDRG4Ew', duration: '18:00' }
            ]
        },
        {
            title: 'モジュール3：データ利活用とダッシュボード構築',
            description: '経験と勘ではなく「データ」で語るための技術です。BIツールの基礎とデータの整え方を学びます。',
            lessons: [
                { title: '統計学の超基礎：データの読み解き方', url: 'https://www.youtube.com/watch?v=d3injoNKz2M', duration: '22:00' },
                { title: 'BIツールによるデータの可視化（Looker Studio等）', url: 'https://www.youtube.com/watch?v=mysS6TTJhuM', duration: '30:00' }
            ]
        },
        {
            title: 'モジュール4：エンジニアリングの入り口（GAS/Python基礎）',
            description: '市販ツールで解決できない課題を「スクリプト」で解決します。プログラミングの基礎概念を重視します。',
            lessons: [
                { title: 'Google Apps Script (GAS) 入門：業務効率化の第一歩', url: 'https://www.youtube.com/watch?v=yFJNZ-0CG5U', duration: '35:00' },
                { title: 'プログラミングの3大要素：順次・分岐・反復', url: 'https://www.youtube.com/watch?v=Ia_kQi_IlPM', duration: '25:00' }
            ]
        },
        {
            title: 'モジュール5：実戦！社内DXプロジェクト管理',
            description: '作ったツールを「浸透」させ、プロジェクトを完遂する力を養います。チェンジマネジメントの重要性を学びます。',
            lessons: [
                { title: '小さく始めるアジャイル開発のススメ', url: 'https://www.youtube.com/watch?v=js83PU0wSmc', duration: '20:00' },
                { title: '社内の抵抗をどう乗り越えるか（チェンジマネジメント）', url: 'https://www.youtube.com/watch?v=3rc_6q2KBfI', duration: '25:00' }
            ]
        }
    ]
};

async function seed() {
    console.log(`Starting seed for: ${CURRICULUM_DATA.track.title}`);

    // 1. Insert/Get Track
    let trackId: string;
    const { data: existingTrack } = await supabase
        .from('courses')
        .select('id')
        .eq('title', CURRICULUM_DATA.track.title)
        .maybeSingle();

    if (existingTrack) {
        trackId = existingTrack.id;
        const { error: trackError } = await supabase
            .from('courses')
            .update({
                description: CURRICULUM_DATA.track.description,
                category: CURRICULUM_DATA.track.category,
                level: CURRICULUM_DATA.track.level,
                is_published: true
            })
            .eq('id', trackId);

        if (trackError) {
            console.error('Error updating track:', trackError);
            return;
        }
        console.log(`Track updated: ${trackId}`);
    } else {
        const { data: newTrack, error: trackError } = await supabase
            .from('courses')
            .insert({
                title: CURRICULUM_DATA.track.title,
                description: CURRICULUM_DATA.track.description,
                category: CURRICULUM_DATA.track.category,
                level: CURRICULUM_DATA.track.level,
                is_published: true
            })
            .select()
            .single();

        if (trackError) {
            console.error('Error inserting track:', trackError);
            return;
        }
        trackId = newTrack.id;
        console.log(`Track inserted: ${trackId}`);
    }

    // 2. Insert Modules and Lessons
    for (let i = 0; i < CURRICULUM_DATA.modules.length; i++) {
        const moduleData = CURRICULUM_DATA.modules[i];
        console.log(`  Seeding Module: ${moduleData.title}`);

        let moduleId: string;
        const { data: existingModule } = await supabase
            .from('course_curriculums')
            .select('id')
            .eq('course_id', trackId)
            .eq('title', moduleData.title)
            .maybeSingle();

        if (existingModule) {
            moduleId = existingModule.id;
            const { error: moduleError } = await supabase
                .from('course_curriculums')
                .update({
                    description: moduleData.description,
                    order_index: i
                })
                .eq('id', moduleId);

            if (moduleError) {
                console.error('  Error updating module:', moduleError);
                continue;
            }
            console.log(`  Module updated: ${moduleId}`);
        } else {
            const { data: newModule, error: moduleError } = await supabase
                .from('course_curriculums')
                .insert({
                    course_id: trackId,
                    title: moduleData.title,
                    description: moduleData.description,
                    order_index: i
                })
                .select()
                .single();

            if (moduleError) {
                console.error('  Error inserting module:', moduleError);
                continue;
            }
            moduleId = newModule.id;
            console.log(`  Module inserted: ${moduleId}`);
        }

        // 3. Insert Lessons
        for (let j = 0; j < moduleData.lessons.length; j++) {
            const lessonData = moduleData.lessons[j];
            console.log(`    Seeding Lesson: ${lessonData.title}`);

            const { data: existingLesson } = await supabase
                .from('course_lessons')
                .select('id')
                .eq('curriculum_id', moduleId)
                .eq('title', lessonData.title)
                .maybeSingle();

            if (existingLesson) {
                const { error: lessonError } = await supabase
                    .from('course_lessons')
                    .update({
                        youtube_url: lessonData.url,
                        duration: lessonData.duration,
                        order_index: j
                    })
                    .eq('id', existingLesson.id);

                if (lessonError) {
                    console.error('    Error updating lesson:', lessonError);
                } else {
                    console.log(`    Lesson updated: ${lessonData.title}`);
                }
            } else {
                const { error: lessonError } = await supabase
                    .from('course_lessons')
                    .insert({
                        curriculum_id: moduleId,
                        title: lessonData.title,
                        youtube_url: lessonData.url,
                        duration: lessonData.duration,
                        order_index: j
                    });

                if (lessonError) {
                    console.error('    Error inserting lesson:', lessonError);
                } else {
                    console.log(`    Lesson inserted: ${lessonData.title}`);
                }
            }
        }
    }

    console.log('Seed completed successfully!');
}

seed().catch(err => {
    console.error('Unexpected error during seed:', err);
});
