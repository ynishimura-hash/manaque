import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

        const body = await req.json();
        const { input, base64Data, mimeType } = body;

        // Validation
        if (!input && !base64Data) {
            return NextResponse.json({ error: 'Input text/URL or File is required' }, { status: 400 });
        }

        let parts: any[] = [];
        let contentToProcess = input || '';

        // CASE 1: File Upload (PDF/Image)
        if (base64Data && mimeType) {
            parts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                }
            });
            console.log(`Processed uploaded file: ${mimeType}`);
        }
        // CASE 2: URL Input (Fetch content and subpages)
        else if (input && (input.startsWith('http://') || input.startsWith('https://'))) {
            try {
                console.log('Fetching Job Main URL:', input);
                const mainRes = await fetch(input, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0' }
                });

                if (!mainRes.ok) throw new Error(`Failed to fetch site: ${mainRes.statusText}`);
                const contentType = mainRes.headers.get('content-type');

                if (contentType && contentType.includes('application/pdf')) {
                    const arrayBuffer = await mainRes.arrayBuffer();
                    const base64 = Buffer.from(arrayBuffer).toString('base64');
                    parts.push({
                        inlineData: {
                            mimeType: 'application/pdf',
                            data: base64
                        }
                    });
                } else {
                    const html = await mainRes.text();

                    // 子ページの探索ロジック (求人詳細, 募集要項など)
                    const sublinks: string[] = [];
                    const linkRegex = /<a\b[^>]*href=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/a>/gi;
                    let match;
                    while ((match = linkRegex.exec(html)) !== null) {
                        let linkUrl = match[1];
                        const linkText = match[2].replace(/<[^>]+>/g, '').trim();

                        if (linkUrl.startsWith('/') || !linkUrl.startsWith('http')) {
                            try { linkUrl = new URL(linkUrl, input).href; } catch (e) { continue; }
                        }

                        // 求人情報に関連しそうなキーワード
                        if (/募集要項|採用情報|仕事内容|仕事詳細|job|recruit|detail/i.test(linkText) ||
                            /募集要項|採用情報|job|recruit|detail/i.test(linkUrl)) {
                            if (linkUrl !== input && !sublinks.includes(linkUrl)) {
                                sublinks.push(linkUrl);
                            }
                        }
                    }

                    console.log('Found likely job subpages:', sublinks.slice(0, 2));

                    // メインページと子ページをフェッチ
                    const cleanedMain = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "")
                        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gm, "")
                        .replace(/<[^>]+>/g, "\n")
                        .replace(/\s+/g, " ").trim();

                    const fetchAndClean = async (u: string) => {
                        try {
                            const res = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                            if (!res.ok) return '';
                            const h = await res.text();
                            return h.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "")
                                .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gm, "")
                                .replace(/<[^>]+>/g, "\n")
                                .replace(/\s+/g, " ").trim();
                        } catch (e) { return ''; }
                    };

                    const subContents = await Promise.all(sublinks.slice(0, 2).map(u => fetchAndClean(u)));

                    contentToProcess = [cleanedMain, ...subContents.filter(Boolean)].join("\n\n--- NEXT PAGE ---\n\n").substring(0, 25000);
                    parts.push({ text: `Source Context: ${contentToProcess}` });
                }
            } catch (fetchError: any) {
                console.error('URL Fetch Error:', fetchError);
                return NextResponse.json({ error: `URL fetch failed: ${fetchError.message}` }, { status: 400 });
            }
        } else if (input) {
            parts.push({ text: `Source Context: ${input}` });
        }

        const prompt = `
        You are an HR specialist. Extract job posting details from the provided document (PDF or text) and format it into a valid JSON object.
        
        Please generate a JSON object matching this schema:
        {
            "title": "string (募集タイトル)",
            "description": "string (募集詳細、仕事の内容や魅力)",
            "requirements": "string (応募要件、必要なスキルや資格)",
            "salary": "string (月収例。例: 25万円〜35万円。数字と単位で短く)",
            "reward": "string (給与詳細。賞与、昇給、手当などを含む詳細な条件)",
            "workingHours": "string (勤務時間、休憩)",
            "holidays": "string (休日、休暇)",
            "welfare": "string (福利厚生)",
            "selectionProcess": "string (選考フロー)",
            "category": "string (新卒, 中途, アルバイト, インターンシップ, 体験JOB, ガクチカバイト, 副業・兼業 の中から最も適切なものを1つ選択)"
        }

        If specific values are not found, infer reasonable professional defaults based on the context.
        All generated text MUST be in Japanese.
        Return ONLY valid JSON.
        `;

        parts.push({ text: prompt });

        const result = await model.generateContent(parts);
        const response = await result.response;
        const textResult = response.text();

        const jsonStr = textResult.replace(/```json\n?|\n?```/g, '').trim();
        const jsonResult = JSON.parse(jsonStr);

        return NextResponse.json(jsonResult);

    } catch (error: any) {
        console.error('AI Generation Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate job' }, { status: 500 });
    }
}
