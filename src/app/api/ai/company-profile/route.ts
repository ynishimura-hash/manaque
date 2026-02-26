import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = 'gemini-2.5-flash-lite';

async function fetchAndCleanContent(url: string) {
    try {
        console.log('Fetching URL:', url);
        const siteRes = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
            },
            next: { revalidate: 3600 }
        });
        if (!siteRes.ok) return null;
        const html = await siteRes.text();

        // HTML text extraction - more aggressive cleaning to stay within token limits
        let text = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "")
            .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gm, "")
            .replace(/<header\b[^>]*>([\s\S]*?)<\/header>/gm, "")
            .replace(/<footer\b[^>]*>([\s\S]*?)<\/footer>/gm, "")
            .replace(/<nav\b[^>]*>([\s\S]*?)<\/nav>/gm, "")
            .replace(/<svg\b[^>]*>([\s\S]*?)<\/svg>/gm, "")
            .replace(/<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gm, "");

        text = text.replace(/<[^>]+>/g, "\n");
        return text.replace(/\s+/g, " ").trim();
    } catch (e) {
        console.error(`Error fetching ${url}:`, e);
        return null;
    }
}

function findCompanyLinks(html: string, baseUrl: string) {
    const linkRegex = /<a\b[^>]*href=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/a>/gi;
    const links: { url: string; text: string }[] = [];
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
        let url = match[1];
        if (!url.startsWith('http')) {
            try {
                url = new URL(url, baseUrl).href;
            } catch (e) { continue; }
        }
        links.push({ url, text: match[2].replace(/<[^>]+>/g, '').trim() });
    }

    const patterns = [
        { regex: /会社概要|会社案内|企業情報|法規|概要|profile|about|company|guide/i, score: 10 },
        { regex: /採用|recruit/i, score: 5 },
    ];

    return links
        .map(link => {
            let score = 0;
            patterns.forEach(p => {
                if (p.regex.test(link.url) || p.regex.test(link.text)) score += p.score;
            });
            // Avoid same page
            if (link.url.replace(/\/$/, '') === baseUrl.replace(/\/$/, '')) score = 0;
            return { ...link, score };
        })
        .filter(l => l.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);
}

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const { input } = await req.json();

        if (!input) {
            return NextResponse.json({ error: 'Input is required' }, { status: 400 });
        }

        let contentToProcess = input;

        // If input is a URL, fetch the content and subpages
        if (input.startsWith('http://') || input.startsWith('https://')) {
            try {
                const mainRes = await fetch(input, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36' }
                });
                if (!mainRes.ok) throw new Error(`Failed to fetch site: ${mainRes.statusText}`);
                const html = await mainRes.text();

                // Find subpages
                const sublinks = findCompanyLinks(html, input);
                console.log('Found subpages:', sublinks.map(l => l.url));

                // Fetch subpages in parallel
                const subContents = await Promise.all(sublinks.map(l => fetchAndCleanContent(l.url)));

                const mainText = html.replace(/<[^>]+>/g, "\n").replace(/\s+/g, " ").trim();
                const combined = [mainText, ...subContents.filter(Boolean)].join("\n\n--- NEXT PAGE ---\n\n");
                contentToProcess = combined.substring(0, 30000); // Expanded limit for gemini-2.0
                console.log('Combined content length:', contentToProcess.length);
            } catch (fetchError: any) {
                console.warn('URL Fetch Warning (proceeding with input text if available):', fetchError);
                // Even if fetch fails, we continue - Gemini might know the company or we use the URL as context
            }
        }

        const prompt = `
        You are an AI assistant that extracts company information from text provided from a company's website (multiple pages might be included).
        SOURCE TEXT: 
        ${contentToProcess}
        
        Please generate a JSON object matching this schema. If info exists on child pages (Company Profile, About Us, etc.), prioritize those for formal details like representative names, capital, and establishment dates.

        {
            "name": "string (正式な会社名)",
            "industry": "string (主要な業種)",
            "location": "string (市区町村/都道府県)",
            "description": "string (100文字以内の概要、学生に伝わりやすい言葉で)",
            "foundingYear": number (設立された西暦4桁、例: 1981),
            "capital": "string (例: 1000万円) または null",
            "employeeCount": "string (例: 50名) または null",
            "representative": "string (代表取締役/社長のフルネーム) または null",
            "address": "string (住所、郵便番号を含む) または null",
            "phone": "string または null",
            "website": "string (公式サイトURL) または null",
            "businessDetails": "string (具体的な事業内容)",
            "philosophy": "string (経営理念・ビジョン) または null",
            "benefits": "string (福利厚生の要約) または null",
            "rjpNegatives": "string (RJP: 業界や事実に基づく、仕事の厳しさや覚悟が必要な点)",
            "rjpPositives": "string (RJP: 仕事のやりがいやポジティブな側面)"
        }

        IMPORTANT:
        - Output EVERYTHING in Japanese. Do not use English for description, philosophy, or RJP fields unless it's a proper noun.
        - Extract "representative" (代表者), "foundingYear" (設立年), and "capital" (資本金) accurately. These are often in a table on "会社概要" (Company Profile) pages.
        - If "昭和XX年" or "平成XX年" is found, convert it to the Western calendar year (e.g. 昭和56年 -> 1981).
        - If specific values are not found explicitly, use reasonable inferences based on the company type or return null.
        - Return ONLY a valid JSON object.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResult = response.text();

        if (!textResult) throw new Error('No content generated');

        // Clean markdown code blocks if present
        const jsonStr = textResult.replace(/```json\n?|\n?```/g, '').trim();

        try {
            const profile = JSON.parse(jsonStr);
            return NextResponse.json(profile);
        } catch (e) {
            console.error('JSON Parse Error:', e, jsonStr);
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
        }

    } catch (error: any) {
        console.error('AI Generation Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate profile' }, { status: 500 });
    }
}
