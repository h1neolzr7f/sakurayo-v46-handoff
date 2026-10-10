// 主线剧本：每章每关都有 pre/post，行 id 唯一（已读快进依赖它），引用的背景/CG/立绘文件都存在，Boss 关有觉醒台词（第 2 章起）。
import assert from 'node:assert/strict'; import fs from 'node:fs'; import vm from 'node:vm';
const ctx = {}; ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of fs.readdirSync('src/runtime').filter(f => /^sakurayo-story-ch\d\.js$/.test(f)).sort()) vm.runInContext(fs.readFileSync('src/runtime/' + f, 'utf8'), ctx);
const S = ctx.SakurayoStory, ART = 'android-app/app/src/main/assets/game/art/', ids = new Set();
const who = new Set(['me', 'sayo', 'aya', 'rion', 'rin', 'miko', 'kagami', 'yoi', 'tanuki', 'guard']);
let lines = 0;
for (const ch of ['ch1', 'ch2']) {
  const n = ch.slice(2); assert.ok(S[ch], ch + ' loaded');
  for (let i = 1; i <= 4; i++) {
    const L = S[ch][`${n}-${i}`]; assert.ok(L && L.pre?.length && L.post?.length, `${n}-${i} has pre/post`);
    for (const part of ['pre', 'post', 'awaken']) for (const l of L[part] || []) {
      lines++; assert.ok(!ids.has(l.id), 'unique id ' + l.id); ids.add(l.id);
      for (const k of ['bg', 'cg']) if (l[k]) assert.ok(fs.existsSync(ART + l[k]), `${l.id} ${k} exists: ${l[k]}`);
      if (l.who) assert.ok(who.has(l.who), 'known speaker ' + l.who);
      for (const side of ['L', 'R']) if (l[side] && !['me', 'sayo', 'aya', 'rion'].includes(l[side].who)) assert.ok(fs.existsSync(`${ART}npc/${l[side].who}/avg_${l[side].ex || 'calm'}.webp`) || fs.existsSync(`${ART}npc/${l[side].who}/avg_calm.webp`), `${l.id} portrait for ${l[side].who}`);
    }
    if (n !== '1' && i === 4) assert.ok(L.awaken?.length, `${n}-4 boss has an awaken line`);
  }
}
for (const c of S.CG) assert.ok(fs.existsSync(ART + c.id), 'gallery CG exists ' + c.id);
console.log('PASS story unit: ch1+ch2 complete,', lines, 'lines, assets present');
