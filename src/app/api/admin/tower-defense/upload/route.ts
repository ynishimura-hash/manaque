import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'images', 'td');

// POST: 画像アップロード
export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const category = formData.get('category') as string || 'misc'; // equipment, character, enemy

        if (!file) {
            return NextResponse.json({ error: 'ファイルが選択されていません' }, { status: 400 });
        }

        // カテゴリサブフォルダを作成
        const categoryDir = path.join(UPLOAD_DIR, category);
        if (!fs.existsSync(categoryDir)) {
            fs.mkdirSync(categoryDir, { recursive: true });
        }

        // ファイル名をユニークにする
        const ext = path.extname(file.name);
        const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_\-\u3000-\u9FFF]/g, '_');
        const fileName = `${baseName}_${Date.now()}${ext}`;
        const filePath = path.join(categoryDir, fileName);

        // ファイルを保存
        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, buffer);

        // 公開URLパスを返す
        const publicUrl = `/images/td/${category}/${fileName}`;
        return NextResponse.json({ url: publicUrl, fileName });
    } catch (e) {
        console.error('Upload error:', e);
        return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 });
    }
}
