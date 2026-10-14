#!/usr/bin/env python3
"""静图去 AI 味批处理（断点续跑）：
  1) 选图：quality_score 评分里 ≥0.3MP 的立绘/卡面/CG/背景（排除帧动画 anim_、特效 fx/vfx、live2d 分层 live/、图集 atlas）。
  2) waifu2x(nunif) art 风格降噪：噪声 >4.5 用 n2，1.5–4.5 用 n1，<1.5 视为干净跳过。
  3) 过曝 >3% 的做高光 rolloff（只压 230 以上）。
  4) 验收：噪声必须下降、拉普拉斯不得跌破 60 且不低于原来的 45%，否则保留原图；输出 webp（保留 alpha），体积超原图 1.3 倍就降质量。
用法：still_enhance.py plan|run|install  [--limit N]  工作目录 /workspace/sakurayo-plan/work/still"""
import sys, os, json, subprocess, shutil, glob
import numpy as np
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')); ART = ROOT + '/android-app/app/src/main/assets/game/art/'
WORK = '/workspace/sakurayo-plan/work/still'; PY = '/workspace/sakurayo-tools/venv/bin/python'; NUNIF = '/workspace/sakurayo-tools/nunif'
sys.path.insert(0, os.path.dirname(__file__)); import importlib.util
spec = importlib.util.spec_from_file_location('qs', os.path.join(os.path.dirname(__file__), 'quality_score.py'))
EXCL = ('anim_', '/fx/', '/vfx/', '/live/', 'atlas', 'ui/nav/', '/icons/', 'shmup/chibi', 'duel/')
def score(f):
    src = open(os.path.join(os.path.dirname(__file__), 'quality_score.py')).read().split('def main')[0]
    g = {}; exec(src.replace('sys.exit(main())', ''), g); return g['score'](f)
def key(rel): return rel.replace('/', '__')
def plan():
    os.makedirs(WORK, exist_ok=True); items = []
    for f in sorted(glob.glob(ART + '**/*.webp', recursive=True)):
        rel = f[len(ART):]
        if any(e in '/' + rel for e in EXCL): continue
        r = score(f)
        if not r or r['w'] * r['h'] < 300000 or r['noise'] < 1.5: continue
        items.append(dict(rel=rel, level=2 if r['noise'] > 4.5 else 1, noise=r['noise'], blur=r['blur'], over=r['over']))
    json.dump(items, open(WORK + '/plan.json', 'w'), indent=0, ensure_ascii=False)
    print('plan', len(items), 'n2', sum(i['level'] == 2 for i in items))
def run(limit):
    items = json.load(open(WORK + '/plan.json'))[:limit]
    for lv in (1, 2):
        ind, outd = '%s/in%d' % (WORK, lv), '%s/w2x%d' % (WORK, lv); os.makedirs(ind, exist_ok=True); os.makedirs(outd, exist_ok=True)
        for f in os.listdir(ind): os.remove(os.path.join(ind, f))
        todo = [i for i in items if i['level'] == lv and not os.path.exists('%s/%s.png' % (outd, key(i['rel'])))]
        for i in todo: Image.open(ART + i['rel']).save('%s/%s.png' % (ind, key(i['rel'])))
        print('level', lv, 'todo', len(todo), flush=True)
        # 分小批调用，被打断时已完成的批次保留
        names = sorted(os.listdir(ind))
        for b in range(0, len(names), 8):
            bd = ind + '_b'; shutil.rmtree(bd, ignore_errors=True); os.makedirs(bd)
            for n in names[b:b + 8]: os.link(os.path.join(ind, n), os.path.join(bd, n))
            subprocess.run([PY, '-m', 'waifu2x.cli', '-m', 'noise', '-n', str(lv), '--style', 'art', '--gpu', '-1', '--tile-size', '256', '-i', bd, '-o', outd], cwd=NUNIF, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print('  batch %d/%d' % (min(b + 8, len(names)), len(names)), flush=True)
    print('RUN DONE', flush=True)
def rolloff(im):
    a = np.asarray(im).astype(np.float32); rgb = a[..., :3]
    hi = rgb > 230; rgb[hi] = 230 + (rgb[hi] - 230) * 0.45; a[..., :3] = rgb
    return Image.fromarray(a.clip(0, 255).astype(np.uint8), im.mode)
def install():
    items = json.load(open(WORK + '/plan.json')); bk = WORK + '/orig'; rep = []
    for i in items:
        p = '%s/w2x%d/%s.png' % (WORK, i['level'], key(i['rel']))
        if not os.path.exists(p): continue
        dst = ART + i['rel']; o = bk + '/' + i['rel']
        if not os.path.exists(o): os.makedirs(os.path.dirname(o), exist_ok=True); shutil.copy2(dst, o)
        src = Image.open(o); im = Image.open(p)
        im = im.convert('RGBA') if src.mode in ('RGBA', 'LA', 'P') and 'A' in src.getbands() or src.mode == 'RGBA' else im.convert('RGB')
        if im.size != src.size: im = im.resize(src.size, Image.LANCZOS)
        if i['over'] > 3: im = rolloff(im)
        tmp = WORK + '/tmp.webp'; size0 = os.path.getsize(o)
        for q in (90, 86, 82):
            im.save(tmp, 'WEBP', quality=q, method=6)
            if os.path.getsize(tmp) <= size0 * 1.3: break
        r = score(tmp); ok = r and r['noise'] < i['noise'] and r['blur'] >= max(60, i['blur'] * .45)
        rep.append(dict(rel=i['rel'], level=i['level'], noise=[i['noise'], r and r['noise']], blur=[i['blur'], r and r['blur']], ok=bool(ok)))
        if ok: shutil.copy(tmp, dst)
        else: shutil.copy2(o, dst)
    json.dump(rep, open(WORK + '/install_report.json', 'w'), indent=0, ensure_ascii=False)
    print('installed', sum(r['ok'] for r in rep), 'kept original', sum(not r['ok'] for r in rep))
if __name__ == '__main__':
    cmd = sys.argv[1]; lim = int(sys.argv[sys.argv.index('--limit') + 1]) if '--limit' in sys.argv else None
    {'plan': plan, 'run': lambda: run(lim), 'install': install}[cmd]()
