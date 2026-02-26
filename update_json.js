const fs = require('fs');
const path = require('path');
const targetPath = path.join(__dirname, 'public/data/td-config.json');
const data = JSON.parse(fs.readFileSync(targetPath, 'utf8'));

data.partners = {
    eggGacha: {
        cost: 1, // 1回1枚
        rates: {
            SSR: 0.5,
            SR: 3,
            R: 16.5,
            N: 80
        }
    },
    fusionRequirement: 3,
    list: [
        { id: '1', name: 'ドラゴン', rarity: 'SSR', description: '伝説の竜', stages: [{ level: 1, name: 'ドラゴン', imageUrl: '/images/partner/dragon.png', stats: { hp: 100, atk: 50, def: 30, tdAttackInterval: 5 }, mergedCount: 0 }] },
        { id: '2', name: '狐', rarity: 'SSR', description: '妖狐', stages: [{ level: 1, name: '狐', imageUrl: '/images/partner/fox.png', stats: { hp: 80, atk: 60, def: 20, tdAttackInterval: 3 }, mergedCount: 0 }] },
        { id: '3', name: '亀', rarity: 'SSR', description: '古代亀', stages: [{ level: 1, name: '亀', imageUrl: '/images/partner/turtle.png', stats: { hp: 150, atk: 20, def: 80, tdAttackInterval: 7 }, mergedCount: 0 }] },
        { id: '4', name: '虎', rarity: 'SSR', description: '白虎', stages: [{ level: 1, name: '虎', imageUrl: '/images/partner/tiger.png', stats: { hp: 110, atk: 55, def: 25, tdAttackInterval: 4 }, mergedCount: 0 }] },
        { id: '5', name: '赤の精霊', rarity: 'SR', description: '炎を操る精霊', stages: [{ level: 1, name: '赤の精霊', imageUrl: '/images/partner/red.png', stats: { hp: 60, atk: 40, def: 15, tdAttackInterval: 4 }, mergedCount: 0 }] },
        { id: '6', name: '緑の精霊', rarity: 'SR', description: '風を操る精霊', stages: [{ level: 1, name: '緑の精霊', imageUrl: '/images/partner/green.png', stats: { hp: 60, atk: 35, def: 20, tdAttackInterval: 3 }, mergedCount: 0 }] },
        { id: '7', name: '青の精霊', rarity: 'SR', description: '水を操る精霊', stages: [{ level: 1, name: '青の精霊', imageUrl: '/images/partner/blue.png', stats: { hp: 70, atk: 30, def: 30, tdAttackInterval: 5 }, mergedCount: 0 }] },
        { id: '8', name: '紫の魔獣', rarity: 'R', description: '闇の魔獣', stages: [{ level: 1, name: '紫の魔獣', imageUrl: '/images/partner/purple.png', stats: { hp: 50, atk: 25, def: 15, tdAttackInterval: 5 }, mergedCount: 0 }] },
        { id: '9', name: '白の聖獣', rarity: 'R', description: '光の聖獣', stages: [{ level: 1, name: '白の聖獣', imageUrl: '/images/partner/white.png', stats: { hp: 50, atk: 15, def: 25, tdAttackInterval: 6 }, mergedCount: 0 }] },
        { id: '10', name: '黒の幻獣', rarity: 'R', description: '影の幻獣', stages: [{ level: 1, name: '黒の幻獣', imageUrl: '/images/partner/black.png', stats: { hp: 45, atk: 30, def: 10, tdAttackInterval: 4 }, mergedCount: 0 }] },
        { id: '11', name: '岩のゴーレム', rarity: 'N', description: '硬い岩の魔物', stages: [{ level: 1, name: '岩のゴーレム', imageUrl: '/images/partner/rock.png', stats: { hp: 80, atk: 15, def: 40, tdAttackInterval: 6 }, mergedCount: 0 }] },
        { id: '12', name: '土のスピリット', rarity: 'N', description: '大地の精霊', stages: [{ level: 1, name: '土のスピリット', imageUrl: '/images/partner/rock.png', stats: { hp: 60, atk: 10, def: 20, tdAttackInterval: 5 }, mergedCount: 0 }] }
    ]
};

data.stages = data.stages.map(stage => {
    if (stage.id >= 3) {
        if (!stage.reward) stage.reward = {};
        stage.reward.eggTickets = 1;
    }
    return stage;
});

fs.writeFileSync(targetPath, JSON.stringify(data, null, 2));
console.log('updated td-config.json successfully');
