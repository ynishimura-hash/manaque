import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'public', 'data', 'td-config.json');

// GET: 設定JSONを取得
export async function GET() {
    try {
        const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
        return NextResponse.json(JSON.parse(data));
    } catch (e) {
        return NextResponse.json({ error: '設定ファイルが見つかりません' }, { status: 404 });
    }
}

// PUT: 設定JSONを更新
export async function PUT(req: Request) {
    try {
        const body = await req.json();
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(body, null, 2), 'utf-8');
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 });
    }
}
