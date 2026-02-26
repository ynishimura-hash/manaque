"use client";

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Application, Assets, Container, Sprite, Graphics, Text, TextStyle } from 'pixi.js';

interface Enemy {
    id: string;
    type: string;
    hp: number;
    maxHp: number;
    position: number;
    speed: number;
    attack: number;
}

interface PixiBattleViewProps {
    enemies: Enemy[];
    playerHp: number;
    maxHp: number;
    characterImage?: string | null;
    partnerImage?: string | null;
}

export interface PixiBattleHandle {
    playEffect: (type: 'slash' | 'magic' | 'fire' | 'ice' | 'heal' | 'shield' | 'dark' | 'coin', targetId: string, level?: number, damage?: number, isCritical?: boolean) => void;
}

const getEnemyImageUrl = (type: string) => {
    switch (type) {
        case 'swarm': return `/images/rpg/monster_swarm${Math.ceil(Math.random() * 3)}.png`;
        case 'tank': return '/images/rpg/monster_tank.png';
        case 'speed': return '/images/rpg/monster_speed.png';
        case 'boss': return '/images/rpg/monster_boss1.png';
        default: return `/images/rpg/monster_swarm${Math.ceil(Math.random() * 3)}.png`;
    }
};

// モンスターの表示サイズ（幅・高さ）。アスペクト比を維持するために個別定義。
const getEnemySize = (type: string): { w: number; h: number; circle: number } => {
    switch (type) {
        case 'tank': return { w: 50, h: 50, circle: 50 };
        case 'speed': return { w: 50, h: 35, circle: 30 }; // 横長で少し大きく
        case 'boss': return { w: 80, h: 80, circle: 70 };
        default: return { w: 26, h: 26, circle: 22 }; // swarmは小さめ
    }
};

const PixiBattleView = forwardRef<PixiBattleHandle, PixiBattleViewProps>(({ enemies, playerHp, maxHp, characterImage, partnerImage }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<Application | null>(null);
    // 敵のスプライトコンテナを管理
    const enemySpritesRef = useRef<Record<string, Container>>({});
    // プレイヤーコンテナ
    const playerContainerRef = useRef<Container | null>(null);
    // HPバー・テキスト参照
    const hpBarRef = useRef<Graphics | null>(null);
    const hpTextRef = useRef<Text | null>(null);

    // PixiJS初期化
    useEffect(() => {
        if (!containerRef.current) return;
        let destroyed = false;

        const init = async () => {
            const app = new Application();
            await app.init({
                width: 800,
                height: 600, // 高さを拡張して上下のエフェクト用スペースを確保
                backgroundAlpha: 0, // 透過色にして背後のDOMを見せる
                resolution: window.devicePixelRatio || 1,
                autoDensity: true,
            });

            if (destroyed) { app.destroy(true); return; }

            // キャンバスを絶対配置にしてコンテナから上下にはみ出させる
            app.canvas.style.position = 'absolute';
            app.canvas.style.top = '-50%'; // 上に150px分はみ出し
            app.canvas.style.left = '0';
            app.canvas.style.width = '100%';
            app.canvas.style.height = '200%'; // 600/300 = 2.0（上下にはみ出し）
            app.canvas.style.pointerEvents = 'none'; // クリックを下のUIにパスする
            app.canvas.style.zIndex = '50';

            containerRef.current?.appendChild(app.canvas);
            appRef.current = app;

            // 全体を150px下にずらして、上位150pxをエフェクトのはみ出し用にする
            const mainContainer = new Container();
            mainContainer.y = 150;
            app.stage.addChild(mainContainer);

            // 背景用マスク（はみ出し部分に背景を描画しないため）
            const bgMask = new Graphics();
            bgMask.rect(0, 0, 800, 300);
            bgMask.fill(0xffffff);
            mainContainer.addChild(bgMask);

            const bgLayer = new Container();
            bgLayer.mask = bgMask;
            mainContainer.addChild(bgLayer);

            // ベース背景色（背景画像がない場合のフォールバック）
            const baseBg = new Graphics();
            baseBg.rect(0, 0, 800, 300);
            baseBg.fill(0x1e293b);
            bgLayer.addChild(baseBg);

            // 背景画像
            try {
                const bgTex = await Assets.load('/images/rpg/story_bg_prologue.png');
                if (!destroyed) {
                    const bg = new Sprite(bgTex);
                    bg.width = 800; bg.height = 400; bg.alpha = 0.5;
                    bgLayer.addChild(bg);
                }
            } catch (e) { /* no bg */ }

            // 地面 (bgLayerに入れるとはみ出さない)
            const ground = new Graphics();
            ground.rect(0, 250, 800, 50);
            ground.fill({ color: 0x0f172a, alpha: 0.85 });
            bgLayer.addChild(ground);


            // キャラクターや敵を入れるレイヤー（これはマスクしないので上にはみ出せる）
            const entityLayer = new Container();
            mainContainer.addChild(entityLayer);
            (app.stage as any).entityLayer = entityLayer; // 他から参照用

            // プレイヤー
            const pc = new Container();
            pc.x = 90; pc.y = 160;

            if (characterImage) {
                try {
                    const tex = await Assets.load(characterImage);
                    if (!destroyed) {
                        const sprite = new Sprite(tex);
                        sprite.anchor.set(0.5, 0.5);
                        sprite.width = 100; sprite.height = 100;
                        pc.addChild(sprite);
                    }
                } catch (e) {
                    const fb = new Graphics(); fb.circle(0, 0, 40); fb.fill(0x3b82f6);
                    pc.addChild(fb);
                }
            } else {
                const fb = new Graphics(); fb.circle(0, 0, 40); fb.fill(0x3b82f6);
                pc.addChild(fb);
            }

            // HPバー背景
            const hpBg = new Graphics();
            hpBg.rect(-50, -72, 100, 8);
            hpBg.fill(0x000000);
            pc.addChild(hpBg);

            // HPバー
            const hpFill = new Graphics();
            hpFill.rect(-50, -72, 100, 8);
            hpFill.fill(0x22c55e);
            pc.addChild(hpFill);
            hpBarRef.current = hpFill;

            // HPテキスト
            const hpTxt = new Text({
                text: `${playerHp}/${maxHp}`,
                style: new TextStyle({ fontSize: 12, fill: 0xffffff, fontWeight: 'bold', stroke: { color: 0x000000, width: 3 } })
            });
            hpTxt.x = -25; hpTxt.y = -88;
            pc.addChild(hpTxt);
            hpTextRef.current = hpTxt;

            entityLayer.addChild(pc);
            playerContainerRef.current = pc;

            // パートナー
            if (partnerImage) {
                const partnerContainer = new Container();
                // プレイヤーの少し後ろ（左）と上に配置
                partnerContainer.x = 40;
                partnerContainer.y = 120;

                try {
                    const pTex = await Assets.load(partnerImage);
                    if (!destroyed) {
                        const pSprite = new Sprite(pTex);
                        pSprite.anchor.set(0.5, 0.5);
                        pSprite.width = 60; pSprite.height = 60;

                        // 少しふわふわ浮遊させるアニメーションを追加
                        let ticks = 0;
                        app.ticker.add(() => {
                            ticks += 0.05;
                            partnerContainer.y = 120 + Math.sin(ticks) * 5;
                        });

                        partnerContainer.addChild(pSprite);
                    }
                } catch (e) {
                    const fb = new Graphics(); fb.circle(0, 0, 20); fb.fill(0xff69b4);
                    partnerContainer.addChild(fb);
                }
                entityLayer.addChild(partnerContainer);
            }
        };

        init();

        return () => {
            destroyed = true;
            if (appRef.current) {
                appRef.current.destroy(true, { children: true });
                appRef.current = null;
            }
            enemySpritesRef.current = {};
            playerContainerRef.current = null;
            hpBarRef.current = null;
            hpTextRef.current = null;
        };
    }, [characterImage, partnerImage]);

    // 敵とHPの更新
    useEffect(() => {
        const app = appRef.current;
        if (!app) return;

        // HPバー更新
        if (hpBarRef.current) {
            hpBarRef.current.clear();
            const ratio = Math.max(0, playerHp / maxHp);
            const color = ratio > 0.5 ? 0x22c55e : ratio > 0.25 ? 0xeab308 : 0xef4444;
            hpBarRef.current.rect(-50, -72, 100 * ratio, 8);
            hpBarRef.current.fill(color);
        }
        if (hpTextRef.current) {
            hpTextRef.current.text = `${playerHp}/${maxHp}`;
        }

        // 死んだ敵を削除
        const aliveIds = new Set(enemies.map(e => e.id));
        Object.keys(enemySpritesRef.current).forEach(id => {
            if (!aliveIds.has(id)) {
                const c = enemySpritesRef.current[id];
                ((app.stage as any).entityLayer || app.stage).removeChild(c);
                c.destroy({ children: true });
                delete enemySpritesRef.current[id];
            }
        });

        // 敵の描画と位置更新
        enemies.forEach((enemy) => {
            let ec = enemySpritesRef.current[enemy.id];
            const size = getEnemySize(enemy.type);

            if (!ec) {
                // 新規作成
                ec = new Container();
                enemySpritesRef.current[enemy.id] = ec;
                ((app.stage as any).entityLayer || app.stage).addChild(ec);

                // 仮の丸（スプライト読み込み前のフォールバック）
                const ph = new Graphics();
                ph.circle(0, 0, size.circle);
                ph.fill(enemy.type === 'tank' ? 0x8b5cf6 : enemy.type === 'boss' ? 0xdc2626 : 0xef4444);
                ph.label = 'placeholder';
                ec.addChild(ph);

                // HPバー背景
                const barW = size.w * 2;
                const ehpBg = new Graphics();
                ehpBg.rect(-barW / 2, -size.circle - 18, barW, 5);
                ehpBg.fill(0x333333);
                ehpBg.label = 'hpBg';
                ec.addChild(ehpBg);

                // HPバー（敵）
                const ehpBar = new Graphics();
                ehpBar.label = 'enemyHpBar';
                ec.addChild(ehpBar);

                // 非同期でスプライト読み込み
                (async () => {
                    try {
                        const tex = await Assets.load(getEnemyImageUrl(enemy.type));
                        if (ec && !ec.destroyed) {
                            // プレースホルダーを削除
                            const placeholder = ec.children.find(c => c.label === 'placeholder');
                            if (placeholder) {
                                ec.removeChild(placeholder);
                                placeholder.destroy();
                            }
                            // スプライト追加
                            const sprite = new Sprite(tex);
                            sprite.anchor.set(0.5, 0.5);
                            sprite.width = size.w * 2.2;
                            sprite.height = size.h * 2.2;
                            sprite.label = 'sprite';
                            ec.addChildAt(sprite, 0);
                        }
                    } catch (e) {
                        // フォールバック丸がそのまま残る
                    }
                })();
            }

            // 位置更新 (position 0=右端 → 100=左端/プレイヤー)
            // position 0 → x=750, position 100 → x=90
            const targetX = 750 - (660 * (Math.max(0, enemy.position) / 100));
            // ボブアニメーション
            const hash = enemy.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
            const bob = Math.sin(Date.now() / 200 + hash) * 5;
            ec.x = targetX;
            // キャラクター(y=160)付近に合わせつつ、敵ごとにIDベースで±25pxずらす
            const yOffset = ((hash * 7) % 50) - 25; // -25 ~ +25 の範囲
            ec.y = 155 + yOffset + bob;

            // 敵HPバー更新
            const ehpBar = ec.children.find(c => c.label === 'enemyHpBar') as Graphics;
            if (ehpBar) {
                ehpBar.clear();
                const barW = size.w * 2;
                const ratio = Math.max(0, enemy.hp / enemy.maxHp);
                ehpBar.rect(-barW / 2, -size.circle - 18, barW * ratio, 5);
                ehpBar.fill(ratio > 0.5 ? 0xff3333 : 0xff8800);
            }
        });
    }, [enemies, playerHp, maxHp]);

    // ド派手エフェクト
    useImperativeHandle(ref, () => ({
        playEffect: (type, targetId, level = 1, damage = 0, isCritical = false) => {
            const app = appRef.current;
            if (!app) return;

            // ターゲット座標
            let tx = 90, ty = 110; // デフォルト=プレイヤー位置
            const targetContainer = enemySpritesRef.current[targetId];
            const isEnemyTarget = !!targetContainer; // 敵が対象かどうか
            if (targetContainer) {
                tx = targetContainer.x;
                ty = targetContainer.y;
            }

            const sc = 1 + ((level - 1) * 0.3);
            const critMul = isCritical ? 1.5 : 1.0;

            // クリティカル時の画面フラッシュ
            if (isCritical) {
                const screenFlash = new Graphics();
                screenFlash.rect(0, 0, 800, 300); // Adjusted to canvas size
                screenFlash.fill({ color: 0xffd700, alpha: 0.3 });
                ((app.stage as any).entityLayer || app.stage).addChild(screenFlash);
                let sf = 0;
                const sfn = () => {
                    sf++; screenFlash.alpha -= 0.03;
                    if (sf > 10) { app.ticker.remove(sfn); ((app.stage as any).entityLayer || app.stage).removeChild(screenFlash); screenFlash.destroy(); }
                };
                app.ticker.add(sfn);
            }

            if (type === 'slash') {
                // === 騎士の超豪華斬撃エフェクト ===
                const bladeColor = isCritical ? 0xffd700 : 0xadd8e6;
                const glowColor = isCritical ? 0xffaa00 : 0x60a5fa;

                // 十字斬撃（メイン）
                for (let i = 0; i < 2; i++) {
                    const mainSlash = new Graphics();
                    mainSlash.rect(-5 * sc, -60 * sc, 10 * sc, 120 * sc);
                    mainSlash.fill({ color: bladeColor, alpha: 0.95 });
                    mainSlash.x = tx; mainSlash.y = ty;
                    mainSlash.rotation = i === 0 ? Math.PI / 6 : -Math.PI / 6;
                    ((app.stage as any).entityLayer || app.stage).addChild(mainSlash);
                    let f = 0;
                    const fn = () => {
                        f++;
                        mainSlash.scale.x += 0.15 * critMul;
                        mainSlash.scale.y += 0.08;
                        mainSlash.alpha -= 0.04;
                        if (f > 22) { app.ticker.remove(fn); ((app.stage as any).entityLayer || app.stage).removeChild(mainSlash); mainSlash.destroy(); }
                    };
                    app.ticker.add(fn);
                }

                // 放射状の剣線（7本）
                for (let i = 0; i < 7; i++) {
                    const blade = new Graphics();
                    const angle = (Math.PI * 2 / 7) * i;
                    blade.rect(-2 * sc, -25 * sc, 4 * sc, 50 * sc);
                    blade.fill({ color: 0xffffff, alpha: 0.7 });
                    blade.x = tx; blade.y = ty;
                    blade.rotation = angle;
                    ((app.stage as any).entityLayer || app.stage).addChild(blade);
                    let f = 0;
                    const fn = () => {
                        f++;
                        blade.x += Math.sin(angle) * 3 * critMul;
                        blade.y += Math.cos(angle) * 3 * critMul;
                        blade.scale.x *= 0.96;
                        blade.alpha -= 0.04;
                        if (f > 20) { app.ticker.remove(fn); ((app.stage as any).entityLayer || app.stage).removeChild(blade); blade.destroy(); }
                    };
                    app.ticker.add(fn);
                }

                // 衝撃波リング（二重）
                for (let ri = 0; ri < 2; ri++) {
                    const ring = new Graphics();
                    ring.circle(0, 0, (10 + ri * 8) * sc);
                    ring.stroke({ color: ri === 0 ? glowColor : 0xfbbf24, width: 3 - ri });
                    ring.x = tx; ring.y = ty;
                    ((app.stage as any).entityLayer || app.stage).addChild(ring);
                    let rf = 0;
                    const rfn = () => {
                        rf++;
                        ring.scale.x += 0.2 + ri * 0.1;
                        ring.scale.y += 0.2 + ri * 0.1;
                        ring.alpha -= 0.035;
                        if (rf > 28) { app.ticker.remove(rfn); ((app.stage as any).entityLayer || app.stage).removeChild(ring); ring.destroy(); }
                    };
                    setTimeout(() => app.ticker.add(rfn), ri * 100);
                }

                // 火花パーティクル
                for (let i = 0; i < (isCritical ? 12 : 6); i++) {
                    const spark = new Graphics();
                    spark.circle(0, 0, (2 + Math.random() * 4) * sc);
                    spark.fill({ color: isCritical ? 0xffd700 : 0xfbbf24, alpha: 0.9 });
                    spark.x = tx; spark.y = ty;
                    const vx = (Math.random() - 0.5) * 10 * critMul;
                    const vy = (Math.random() - 0.5) * 10 * critMul;
                    ((app.stage as any).entityLayer || app.stage).addChild(spark);
                    let f = 0;
                    const fn = () => {
                        f++; spark.x += vx; spark.y += vy + f * 0.2; spark.alpha -= 0.03;
                        if (f > 30) { app.ticker.remove(fn); ((app.stage as any).entityLayer || app.stage).removeChild(spark); spark.destroy(); }
                    };
                    app.ticker.add(fn);
                }

                // 地面衝撃波
                const groundWave = new Graphics();
                groundWave.rect(-60 * sc, -3, 120 * sc, 6);
                groundWave.fill({ color: glowColor, alpha: 0.6 });
                groundWave.x = tx; groundWave.y = 310;
                ((app.stage as any).entityLayer || app.stage).addChild(groundWave);
                let gf = 0;
                const gfn = () => {
                    gf++; groundWave.scale.x += 0.15; groundWave.alpha -= 0.04;
                    if (gf > 15) { app.ticker.remove(gfn); ((app.stage as any).entityLayer || app.stage).removeChild(groundWave); groundWave.destroy(); }
                };
                app.ticker.add(gfn);

            } else if (type === 'fire') {
                // === 炎の魔法（ファイアボール / 爆発） ===
                const explosion = new Graphics();
                explosion.circle(0, 0, 40 * sc * critMul);
                explosion.fill({ color: 0xff4500, alpha: 0.8 });
                explosion.x = tx; explosion.y = ty;
                ((app.stage as any).entityLayer || app.stage).addChild(explosion);
                let ef = 0;
                const efn = () => {
                    ef++;
                    explosion.scale.x += 0.15;
                    explosion.scale.y += 0.15;
                    explosion.alpha -= 0.05;
                    if (ef > 18) { app.ticker.remove(efn); ((app.stage as any).entityLayer || app.stage).removeChild(explosion); explosion.destroy(); }
                };
                app.ticker.add(efn);

                // 炎の破片
                for (let i = 0; i < 15; i++) {
                    const spark = new Graphics();
                    spark.rect(-3 * sc, -3 * sc, 6 * sc, 6 * sc);
                    spark.fill({ color: Math.random() > 0.5 ? 0xff0000 : 0xffa500, alpha: 0.9 });
                    spark.x = tx; spark.y = ty;
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 5 + Math.random() * 8;
                    ((app.stage as any).entityLayer || app.stage).addChild(spark);
                    let f = 0;
                    const fn = () => {
                        f++;
                        spark.x += Math.cos(angle) * speed;
                        spark.y += Math.sin(angle) * speed - f * 0.2; // 少し上に舞う
                        spark.rotation += 0.2;
                        spark.alpha -= 0.03;
                        if (f > 25) { app.ticker.remove(fn); ((app.stage as any).entityLayer || app.stage).removeChild(spark); spark.destroy(); }
                    };
                    app.ticker.add(fn);
                }

            } else if (type === 'ice') {
                // === 氷の魔法（ブリザード） ===
                for (let i = 0; i < 12; i++) {
                    const icicle = new Graphics();
                    icicle.rect(-2 * sc, -15 * sc, 4 * sc, 30 * sc);
                    icicle.fill({ color: 0x00ffff, alpha: 0.7 });
                    icicle.x = tx + (Math.random() - 0.5) * 80;
                    icicle.y = ty - 100 - Math.random() * 50;
                    const targetY = ty + (Math.random() - 0.5) * 20;
                    ((app.stage as any).entityLayer || app.stage).addChild(icicle);
                    let f = 0;
                    const fn = () => {
                        f++;
                        icicle.y += 12; // 落下速度
                        if (icicle.y >= targetY) {
                            // 砕けるエフェクトに移行
                            app.ticker.remove(fn);
                            icicle.clear();
                            icicle.circle(0, 0, 10 * sc);
                            icicle.fill({ color: 0x88ffff, alpha: 0.5 });
                            let sf = 0;
                            const sfn = () => {
                                sf++;
                                icicle.scale.x += 0.1;
                                icicle.scale.y += 0.1;
                                icicle.alpha -= 0.05;
                                if (sf > 10) { app.ticker.remove(sfn); ((app.stage as any).entityLayer || app.stage).removeChild(icicle); icicle.destroy(); }
                            }
                            app.ticker.add(sfn);
                        }
                    };
                    setTimeout(() => app.ticker.add(fn), i * 50); // 時間差で降らす
                }

            } else if (type === 'heal' || type === 'shield') {
                // === 回復・シールド（プレイヤー基準） ===
                const pty = 200; // プレイヤーのY座標
                const ptx = 90;

                // 光の柱
                const pillar = new Graphics();
                pillar.rect(-20 * sc, -150 * sc, 40 * sc, 150 * sc);
                pillar.fill({ color: type === 'heal' ? 0x00ff00 : 0x00bfff, alpha: 0.5 });
                pillar.x = ptx; pillar.y = pty;
                ((app.stage as any).entityLayer || app.stage).addChild(pillar);
                let pf = 0;
                const pfn = () => {
                    pf++;
                    pillar.alpha -= 0.02;
                    if (pf > 20) { app.ticker.remove(pfn); ((app.stage as any).entityLayer || app.stage).removeChild(pillar); pillar.destroy(); }
                };
                app.ticker.add(pfn);

                // 上昇する光の粒
                for (let i = 0; i < 10; i++) {
                    const orb = new Graphics();
                    orb.circle(0, 0, 4 * sc);
                    orb.fill({ color: type === 'heal' ? 0xadff2f : 0x87cefa, alpha: 0.8 });
                    orb.x = ptx + (Math.random() - 0.5) * 40;
                    orb.y = pty;
                    ((app.stage as any).entityLayer || app.stage).addChild(orb);
                    let f = 0;
                    const fn = () => {
                        f++;
                        orb.y -= 2 + Math.random() * 2;
                        orb.alpha -= 0.02;
                        if (f > 40) { app.ticker.remove(fn); ((app.stage as any).entityLayer || app.stage).removeChild(orb); orb.destroy(); }
                    };
                    app.ticker.add(fn);
                }

            } else if (type === 'magic') {
                // パーティクル散乱
                const colors = [0xa855f7, 0x6366f1, 0xec4899, 0x38bdf8];
                const count = isCritical ? 14 : 8;
                for (let i = 0; i < count; i++) {
                    const p = new Graphics();
                    p.circle(0, 0, (6 + Math.random() * 12) * sc * critMul);
                    p.fill({ color: isCritical ? 0xffd700 : colors[i % 4], alpha: 0.85 });
                    p.x = tx; p.y = ty;
                    const vx = (Math.random() - 0.5) * 14 * critMul;
                    const vy = (Math.random() - 0.5) * 14 * critMul;
                    ((app.stage as any).entityLayer || app.stage).addChild(p);
                    let f = 0;
                    const fn = () => {
                        f++; p.x += vx; p.y += vy; p.scale.x *= 0.95; p.scale.y *= 0.95; p.alpha -= 0.033;
                        if (f > 30) { app.ticker.remove(fn); ((app.stage as any).entityLayer || app.stage).removeChild(p); p.destroy(); }
                    };
                    app.ticker.add(fn);
                }
                // フラッシュ
                const flash = new Graphics();
                flash.circle(0, 0, 30 * sc * critMul);
                flash.fill({ color: isCritical ? 0xffd700 : 0xffffff, alpha: 0.9 });
                flash.x = tx; flash.y = ty;
                ((app.stage as any).entityLayer || app.stage).addChild(flash);
                let ff = 0;
                const ffn = () => {
                    ff++; flash.scale.x += 0.25; flash.scale.y += 0.25; flash.alpha -= 0.07;
                    if (ff > 14) { app.ticker.remove(ffn); ((app.stage as any).entityLayer || app.stage).removeChild(flash); flash.destroy(); }
                };
                app.ticker.add(ffn);

            } else if (type === 'coin') {
                // コインシャワー
                const count = isCritical ? 16 : 10;
                for (let i = 0; i < count; i++) {
                    const coin = new Graphics();
                    coin.circle(0, 0, (5 + Math.random() * 7) * sc);
                    coin.fill(0xfabd04);
                    coin.stroke({ color: 0xb45309, width: 2 });
                    coin.x = tx + (Math.random() - 0.5) * 40;
                    coin.y = ty;
                    const vy = -(3 + Math.random() * 10) * critMul;
                    const vx = (Math.random() - 0.5) * 5;
                    ((app.stage as any).entityLayer || app.stage).addChild(coin);
                    let f = 0;
                    const fn = () => {
                        f++; coin.x += vx; coin.y += vy + f * 0.4; coin.rotation += 0.15; coin.alpha -= 0.022;
                        if (f > 38) { app.ticker.remove(fn); ((app.stage as any).entityLayer || app.stage).removeChild(coin); coin.destroy(); }
                    };
                    app.ticker.add(fn);
                }
            }

            // === ダメージ数値表示 ===（敵に対してのみ表示）
            if (damage > 0 && isEnemyTarget) {
                const dmgText = isCritical ? `💥 ${damage}` : `${damage}`;
                const dmgColor = isCritical ? 0xffd700 : 0xffffff;
                const dmgSize = isCritical ? 32 * sc : 22 * sc;
                const dmg = new Text({
                    text: dmgText,
                    style: new TextStyle({
                        fontSize: dmgSize,
                        fill: dmgColor,
                        fontWeight: 'bold',
                        stroke: { color: isCritical ? 0x8b0000 : 0x000000, width: isCritical ? 5 : 4 },
                    })
                });
                dmg.anchor.set(0.5);
                dmg.x = tx + (Math.random() - 0.5) * 20;
                dmg.y = ty - 10 * sc;
                if (isCritical) { dmg.scale.set(1.6); }
                ((app.stage as any).entityLayer || app.stage).addChild(dmg);
                let dtf = 0;
                const dtfn = () => {
                    dtf++;
                    dmg.y -= isCritical ? 1.0 : 0.8;
                    if (isCritical && dtf < 8) { dmg.scale.x *= 0.92; dmg.scale.y *= 0.92; }
                    dmg.alpha -= isCritical ? 0.03 : 0.04;
                    if (dtf > 30) { app.ticker.remove(dtfn); ((app.stage as any).entityLayer || app.stage).removeChild(dmg); dmg.destroy(); }
                };
                app.ticker.add(dtfn);
            }

            // クリティカル時の「CRITICAL!」テキスト（敵に対してのみ表示）
            if (isCritical && isEnemyTarget) {
                const critText = new Text({
                    text: '⚡ CRITICAL!',
                    style: new TextStyle({
                        fontSize: 28 * sc,
                        fill: 0xff4444,
                        fontWeight: 'bold',
                        stroke: { color: 0x000000, width: 5 },
                    })
                });
                critText.anchor.set(0.5);
                // 対象により位置を微調整（画面の右か左かでずらす）
                const isPlayerTarget = tx < 150;
                critText.x = tx + (isPlayerTarget ? 20 : -20);
                critText.y = ty - 40 * sc;
                critText.scale.set(2);
                ((app.stage as any).entityLayer || app.stage).addChild(critText);
                let cf = 0;
                const cfn = () => {
                    cf++;
                    critText.y -= 0.8;
                    if (cf < 10) { critText.scale.x *= 0.9; critText.scale.y *= 0.9; }
                    critText.alpha -= 0.03;
                    if (cf > 35) { app.ticker.remove(cfn); ((app.stage as any).entityLayer || app.stage).removeChild(critText); critText.destroy(); }
                };
                app.ticker.add(cfn);
            }
        }
    }));

    return (
        <div className="w-full h-full flex justify-center items-center rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-slate-700 relative bg-slate-800">
            <div ref={containerRef} className="absolute inset-0 flex justify-center items-center" />
        </div>
    );
});

export default PixiBattleView;
