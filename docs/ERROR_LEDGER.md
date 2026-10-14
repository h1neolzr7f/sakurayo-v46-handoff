# ERROR_LEDGER · 错误台账

> 写 UI / 场景前先过「写 UI 前必查清单」。每条错误写：编号、类别、场景/尺寸、现象、根因、修法、预防（自动检查或规则）。

## 写 UI 前必查清单

1. **横屏优先**：弹窗 / 说明 / 确认框用左右分栏或横向网格；不要竖直堆满后再靠滚动。`tools/sweep.mjs` 的 `vscroll:` 检测会报「竖屏式堆叠、横屏空间未利用」。长列表进白名单并写明理由。
2. **矮横屏一屏放下**：至少在 1024×461、844×390 下弹窗内容不出现纵向滚动；按钮并排在右下，不要撑满整行。
3. **立绘头部安全区**：立绘顶部不能被页头 / 标题挡住（见 `sakurayo-portrait.js`）；检查 1024×461、844×390、1280×720、2400×1080。
4. **触控与文字**：不要搬全局强制字号；只对真正看不清的局部做微调，并出修前修后对比。
5. **战斗 HUD**：任务文案允许两行，不要靠 `ellipsis` 截断关键信息；COMBO 与小地图不得重叠。
6. **帧率**：默认 60fps（跟随刷新率）；只有用户手动省电或连续 5 秒 <40fps 才降级。见 PLAYBOOK「帧率与画质」。
7. **镜头**：割草按屏幕短边固定纵向世界单位（`VIEW_H46`），自机约占屏高 10%–12%。
8. **风格**：崩坏三式中式科技二次元为主；**和风元素可保留**（用户 2026-10-14：和风就和风，能用就行，多种美学可并存）。优先去掉 AI 味（噪点 / 油光 / 塑料感），不为去和风重画。

## 条目

### E001 · 竖屏式堆叠、横屏空间未利用
- **场景/尺寸**：新手教学弹窗 · 1024×461
- **现象**：图标、标题、说明、两个全宽按钮上下堆叠，第二按钮被挤出屏幕，需要纵向滚动；按钮还是旧版亮蓝圆角。
- **根因**：弹窗按竖屏单栏设计，未利用横屏宽度。
- **修法**：左右分栏（左插图、右标题/说明/步骤/按钮）；「跳过」「下一步」右下并排；v2 切角样式；一屏放下。
- **预防**：`tools/sweep.mjs` 报 `vscroll:`；白名单只收真正的长列表。

### E002 · 任务文字被截断
- **场景/尺寸**：割草 HUD · 1024×461
- **现象**：任务条末尾「…」，关键提示读不全。
- **根因**：`.mission{white-space:nowrap;text-overflow:ellipsis;max-height:…}` 单行强制省略。
- **修法**：横屏下改为两行 `-webkit-line-clamp:2`，去掉强制单行省略。
- **预防**：巡检人工看图 + `clip:` 检测；登记本条。

### E003 · COMBO 与小地图重叠
- **场景/尺寸**：割草 HUD · 1024×461
- **现象**：「15 COMBO」压在小地图左上角。
- **根因**：`#combo` 的 `top` 与 `#minimap46` 落在同一垂直带。
- **修法**：把 COMBO 挪到小地图正下方（`top: calc(safe + 168~190px)`）。
- **预防**：巡检；后续可加包围盒重叠报告。

### E004 · 实机自动进「省电 30fps」
- **场景/尺寸**：割草 · 安卓 WebView
- **现象**：右上角显示「省电 30fps」，体感卡。
- **根因**：`adaptiveQuality48` 在任意一秒 `fps < 42` 立刻降到 0.62；开局加载抖动也会触发；标签把自适应降级也写成「省电」。
- **修法**：连续 5 秒 <40fps 才降级，连续 3 秒 ≥52fps 恢复；手动 `settings.fx===0` 才显示「省电」；否则显示「降级」或「高画质」。可变步长按真实 dt 推进。
- **预防**：PLAYBOOK「帧率与画质」；实机录像帧时间统计。

### E005 · 矮屏自机占比过大
- **场景/尺寸**：割草 · 1024×461
- **现象**：自机约占屏高 25%+，视野过小。
- **根因**：相机视野按 CSS 像素 1:1 映射世界单位，矮屏纵向世界单位变少。
- **修法**：固定 `VIEW_H46=900` 世界单位纵向视野，`ZOOM46 = screenH / VIEW_H46`；自机约 12% 屏高。
- **预防**：平衡测试 + 实机尺寸截图对比。

### E006 · 割草残留和风鸟居 / 灯笼
- **场景/尺寸**：割草地图道具
- **现象**：红色鸟居与和风灯笼 procedurally 绘制。
- **根因**：`lifecycle` / `props` 用 canvas 硬画鸟居轮廓。
- **修法**：换成 `props/paifang.webp`、`lantern_tech.webp`、更新 `shrine.webp`（中式科技风）。
- **预防**：割草 procedurally 绘制的鸟居/灯笼仍应换成科技风道具；**立绘/PV 背景里的和风可保留**（见清单第 8 条）。不为去和风批量重画。

### E007 · 主线 Boss 关漏接「迎战方式三选一」
- **场景/尺寸**：主线关卡地图 1-4 / 2-4 / 3-4 / 4-4 · 实机反馈
- **现象**：夜行层主可以选割草 / 格斗 / 弹幕射击，主线章节 Boss 只能割草，没有任何入口。
- **根因**：三选一只做在夜行（`SakurayoRun.BOSS_MODES`、`runBossMode46`、`bossmode` 弹窗），需求是「所有 Boss」，主线关卡入口 `launchLevel46` 没接；测试也只覆盖了夜行。
- **修法**：关卡详情面板（`.lm46Sheet`）对 Boss 关显示「迎战方式」切角三段选择 `.sbm46`，默认夜行路线推荐项，选择存 `save.storyBossMode46`。格斗/弹幕复用 `SakurayoDuel` / `SakurayoShmup`，打完走一次 `startGame→finish` 正常结算（星级映射：破防=收取符卡/赢下回合；被弹=弹幕被弹/格斗承伤÷12），解锁、post 剧情、「再次迎击」都与割草一致。
- **预防**：`tests/story_boss_mode_smoke.mjs`：三种模式各进一次主线 Boss 并结算；1024×461 详情面板无滚动、无遮挡。新增「所有 X 都要……」类需求时，先 grep 所有入口（夜行 / 主线 / 主神 / 试炼）列清单再动手。

### E008 · 凛音摸头视频与本体不一致
- **场景/尺寸**：看板娘 rion `tap_head`
- **现象**：首尾帧和待机帧对不上（PSNR 17 dB），循环衔接处会跳一下，脸也和本体不一样。
- **根因**：原视频是用不同的参考图生成的，属于“走样”素材；只调时间或做 RIFE 补帧都救不回来（逐帧对齐搜索最好也只有 19.5 dB）。
- **修法**：先删掉这条，摸头池只保留 `tap_head2`。要真正重做，得在 Grok 会话里拿凛音待机首帧当参考重新生成。
- **预防**：`tools/video/mascot_seam_check.py` 接进了 `verify.sh`；`mascot_fit.py` 遇到低于 25 dB 的素材直接拒绝。

### E009 · 中转站出图时好时坏
- **场景**：用 gpt-image-2 生成或编辑素材
- **现象**：间歇返回 502/530，有时连着失败几分钟。
- **修法**：`relay_img.py` 带浏览器 UA，失败后每 100 s 重试，最多 30 次，后台排队跑。
- **预防**：出图都放后台任务跑，产出逐张人工核对构图和人物有没有被改；提示词里明确写“no gates/archways/pillars”，否则还会画出鸟居的变体。

### E010 · 看板娘批处理重复进程互相覆盖
- **现象**：`pkill` 只杀掉了子进程，外层 bash 循环还在，又起了一批任务，往同一批文件里写。
- **修法**：杀掉父循环，从 `/tmp/mascot_orig` 恢复原片，每个角色单独跑一个任务重新处理。
- **预防**：批处理统一用一个脚本启动，并写 pid 文件；动手前先看 `pgrep -af`。

### E011 · 合并后颜色令牌门禁失败
- **现象**：`check_colors.py` 报 index.html、lobby、shmup、weapons、boss-pv 的硬编码颜色比基线多（2454 → 2610）。
- **根因**：快进 #34 之后（734281d）就已经是 2550；合并 719a6f6 加上手工移植 #33（本命契约、破界、星级 UI），又多了大约 60 处。
- **处理**：先把这次合并后的数字登记为新基线，让回归能继续跑。这笔是技术债，没有真正修掉。
- **待办**：把 #33/#34 带进来的颜色归并成 `--c-*` 令牌（金色系 #ffd36b/#ffe08a，青色系 #6ff3ff，粉色系 #ff7fb0/#ff9ec4），再把基线往下调。

### E012 · 静图动态版盲探导致 404
- **现象**：普通发布模式下控制台出现 14 条 `ERR_FILE_NOT_FOUND`，browser_smoke 要求 0 条，因此失败。
- **根因**：合并进来的 `attachStillVideo46` 会对封面、加载页、大厅、章节图等每张静图都去探测同名 mp4 和 webm，但这些动态版素材从来没有提交过。
- **修法**：加了 `STILL_PV46` 登记表，只有登记过的 stem 才会挂视频。
- **预防**：新增动态背景时同时登记；browser_smoke 继续要求控制台 0 错误。

### E013 · 中转站无可用出图账号（503）
- **场景**：`relay_img.py` → `litangking.12gg.workers.dev` 生图 / 重画高噪静图
- **现象**：HTTP 503，正文 `The image generation tool encountered an error`，错误码 `no_available_account`（2026-10-14 20:58–21:26 多次实测）。
- **根因**：中转站可达，但池里没有可用出图账号；不是网络或 UA 问题。
- **修法**：暂停空转重试；噪声>4.5 清单见 `/workspace/sakurayo-plan/work/still/noise_gt45_pending.txt`（34 张），等账号恢复后再重画并视觉 QA。期间推视频全量增强与不依赖中转站的 UI/回归。
- **预防**：生图前先用单张探针；连续 503/`no_available_account` 立即停，不要后台空转；在 ERROR_LEDGER / PROGRESS 标明「等中转站」。

### E014 · 看板娘增强后单段超 1.5MB / 与 idle 接缝 PSNR 短暂下降
- **场景**：`video_enhance.sh` CRF 20 输出 live_video；`mascot_seam_check.py` 门禁单段 ≤1.5MB、角色合计 ≤8MB、动作首尾对 idle PSNR ≥35。
- **现象**：aya act2 增强后 1.57MB；act1–3 对尚未增强的 idle PSNR ~28（原版 ~36–42）。
- **修法**：live_video 编码改 CRF≥24，超 1.45MB 递增 CRF 至 ≤30（已写入 `video_enhance.sh`）；act1–3 用原 SR 帧重压装入（0c73226）。idle/其余片段同一管线跑完后复测 PSNR；若仍 <35 再跑 mascot_fit 接缝。
- **预防**：增强看板娘视频后必须跑 `mascot_seam_check.py`；体积门禁写进 enhance 脚本而不是事后发现。

### E015 · AVG 结束后视频回调读空 cur.o
- **场景**：`levels_smoke` / 关卡内 AVG 播完或跳过；背景/CG 尝试加载 mp4/webm
- **现象**：控制台 `TypeError: Cannot read properties of null (reading 'o')`（偶发两条）
- **根因**：`showBg`/`showCg` 的 `video.onerror` 异步回调里调用 `url()`，而 `end()` 已把 `cur` 置 null；`url()` 无防护直接读 `cur.o`
- **修法**：`url()` / `onCg` 判空；`end()` 时清空 bg/cg video 的 onerror/onloadeddata
- **预防**：异步 DOM 回调不得假设会话对象仍存活；AVG 回归保留 `errors` 必须为空

### E016 · mascot_sizes_smoke 在全员 live_video 后画布 0×0 / 超时
- **场景**：三角色均登记 `live_video/*/clips.js`；`mountRig46` 优先挂视频并 `unmount` mesh canvas
- **现象**：`mascot_sizes_smoke` 等 `rigSnapshot46` 偶发超时，或 `getBoundingClientRect` 得 w=0/h=0（vid46 路径无 canvas）
- **根因**：本测专验 WebGL/2D mesh rig，与默认视频看板娘互斥；未强制禁视频
- **修法**：`mountRig46` 支持 `?novideo=1`；测试 URL 带该参数，并等待非 vid46 且 canvas>50px
- **预防**：rig 尺寸回归必须 `novideo=1`；视频路径由 `mascot_video_smoke` 覆盖

### E017 · 结算“坚持”显示 -1:-1
- **场景**：夜间 QA `result` 1024×461；开局倒计时内即结算（finishNow46）
- **现象**：战绩“坚持 -1:-1”
- **根因**：`fmt()` 未对负数 runTime 取下限，Math.floor(-0.x)=-1
- **修法**：`fmt` 统一 `Math.max(0, Number(x)||0)`
- **对比**：/workspace/sakurayo-plan/shots/night_qa/compare/E017_E018_result_r.png

### E018 · 矮横屏结算按钮两行吸底压住战绩
- **场景**：1024×461 结算
- **现象**：“再次迎击 / 返回主界面”竖排两行（约 100px）吸底，盖住战绩中段
- **根因**：并排按钮的紧凑规则只在 `max-height:440px` 生效，461 落在空档；吸底渐变 30% 才变实，文字从按钮下透出
- **修法**：阈值放宽为 `max-height:560px and landscape`，吸底底色 10px 内变实
- **预防**：矮横屏规则统一用 560px 阈值（与 levelup/商店一致），sweep 固定跑 r=1024×461
- **对比**：/workspace/sakurayo-plan/shots/night_qa/compare/E017_E018_result_r.png

### E019 · 设置抽屉透底 + 单列堆叠
- **场景**：大厅“声音设置”，1280×720 / 1024×461
- **现象**：玻璃底透出整个大厅立绘与按钮，文字难读；9 项单列竖排，横屏需滚 2 屏，开关按钮落在屏外
- **根因**：`#settingsDrawer37` 是后加抽屉，没有专属样式也没有页头美术，只吃到通用半透明玻璃
- **修法**：实色深底；横屏双列网格（`.settingGroup39` display:contents 并入网格），行距压缩；竖屏仍单列
- **对比**：/workspace/sakurayo-plan/shots/night_qa/compare/E019_settings_d.png、/workspace/sakurayo-plan/shots/night_qa/compare/E019_settings_r.png

### E020 · 矮横屏商店首行购买按钮在屏外 + 编号徽标压余额
- **场景**：商店·服饰 1024×461
- **现象**：卡片立绘 140px，首行“已装备/价格”按钮被屏幕底部截断；页头 DEP-03 徽标盖住右上樱花币余额
- **修法**：`max-height:560px` 横屏下立绘 96px、简介两行截断；商店徽标左移避开余额
- **对比**：/workspace/sakurayo-plan/shots/night_qa/compare/E020_shop_r.png

### E021 · 弹幕 STG 侧栏“Spell Card”被触屏键盖住
- **场景**：shmup 1024×461
- **现象**：侧栏底部“Spell Card / 道中”与 觉醒/低速/符卡 三键重叠
- **根因**：侧栏底部预留按“画布高度<480”猜 70px，但 CSS 只在视口≤440 才缩小按钮，461 时按钮实际 66+28px
- **修法**：预留量按视口与 CSS 同一阈值取 80/108 CSS px 并换算到画布像素；行距下限 1.35f→1.2f
- **对比**：/workspace/sakurayo-plan/shots/night_qa/compare/E021_shmup_r.png
