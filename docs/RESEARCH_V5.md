# 樱夜 · V5 调研：同角色多形态 + 外观变现 + 全肉鸽

> 2026-10-10 · 调研方式：WebSearch / 公开资料。每条结论标注来源；**[推断]** 表示是根据资料做的判断，不是资料原文。
> 目的：给 `docs/DESIGN_V5.md` 提供依据。用户方案要点：只有小夜、绫、凛音三个角色，卖角色「形态」与周边（武器外观、特效、角色故事卡片），形态由局内选择与 Boss 阶段触发，玩法全部肉鸽化。

## 1. 作品逐个拆解

| 作品 | 可借鉴的点 | 对樱夜的启发 | 来源 |
|---|---|---|---|
| **Hades** 武器形态（Aspects） | 6 把武器 × 每把 4 个形态；第 1 形态只是数值，第 2–3 形态改招式，第 4「隐藏形态」彻底改写武器；用局内掉落的泰坦之血解锁，隐藏形态还要剧情台词「唤醒」。形态会改变武器外观。镜子（Mirror of Night）是局外天赋，红/绿两版二选一、可免费重置。 | 「同一角色的形态」就是 Hades 的 Aspect：**形态应改招式/规则，不只是数值**；解锁靠局内资源和剧情，不是付费。隐藏形态的剧情唤醒很适合樱夜的 AVG。 | RPG Site 形态指南；Hades Wiki「Infernal Arms」「Mirror of Night」；teemo.dev「Weapon Aspects & In-Run Upgrades」 |
| **崩坏3 往世乐土** | 女武神 + 刻印（Signet）流派；同一流派凑 3 张换「核心」刻印；分「主要/情境/增益」刻印；楼层与商店节奏。 | 樱夜的「构筑流派」可直接借鉴「凑 3 张 → 核心（形态解锁）」；崩3 本体是**同一角色出多套作战服（不同玩法），各自卖**——和「卖形态」最接近的成功先例 **[推断：作战服模式为公开常识，本次检索未单独取证]**。崩3 服装另由服装商店/活动/B-Chips 获取。 | Reddit r/houkai3rd 刻印指南；rentry 乐土构筑；Honkai Impact 3 Wiki「Costume Shop」「Outfits」 |
| **崩铁 模拟宇宙·寰宇蝗灾** | 选主命途，集 3 个主命途祝福 + 3 个兼容副命途祝福 →「命途回响交错」；每条命途只有 2 条兼容副命途；局外积分换模式内永久增益。 | 形态 = 命途：**主形态 + 兼容副形态**的组合规则可以控制组合数量（避免平衡爆炸）。 | Prima Games / Game Rant 命途交错；HSR Wiki「Swarm Disaster」 |
| **明日方舟 集成战略** | 希望/招募券等资源约束、分队改变起始资源、藏品叠加（有增益也有故意的负面）、隐藏结局需要特定事件链和第 6 层 Boss。 | 「分队」= 樱夜的开局形态选择；隐藏结局链 = 形态剧情唤醒；负面藏品适合做「形态代价」。 | Arknights Terra Wiki「Integrated Strategies」/Guide；GamePress |
| **死亡细胞** | 服装（Outfits）**不单卖**，靠蓝图掉落 + 收集者用细胞解锁，基本纯外观；少数服装有剧情/钥匙功能（开 DLC 区域、真结局对白）；收入来自**内容 DLC**（4.99–9.99 美元）。部分服装会改武器动画/伤害数字字体。 | 外观可以作为「局内成就奖励」长期刷；真正卖钱的是**内容扩展**。服装改动画/数字字体是很便宜的「特效升级」。 | Dead Cells Wiki「Outfits」；Steam 讨论；Steam DLC 页 |
| **Brotato** | 40+ 角色都是同一个土豆，靠**规则修改**（只能近战、站桩才攻击、只有一个武器槽）区分。 | 只有 3 个角色时，用「规则型形态」便宜地扩充可玩性：**一个形态 = 一条规则 + 一组美术配色**，美术成本低、玩法差异大。 | teemo.dev Brotato 角色参考；Brotato Wiki |
| **弹壳特攻队** | 混合变现：内购 + 广告，体力、装备碎片、章节礼包、订阅、活动扭蛋（皮肤/神器可选目标）；IAP 超 2.5 亿美元（2023-06），2025 年仍约 500–600 万美元/月。Naavik 指出 Archero 类「只需一个英雄一套装备」→ 养成轨道太窄，长线乏力。 | 割草肉鸽的商业成功主要靠**数值养成**而不是外观；樱夜选择「外观变现」意味着放弃这条最赚钱的路，需要别的支撑（见失败案例）。「可选目标扭蛋」值得借鉴。 | mobilegamer.biz；Gamesforum；Gamigion；Naavik |
| **雷霆战机** | 付费核心是「资源限制 + 随机获取」：体力、Boss 次数、抽卡、贵族特权；战机/装甲/副武器/僚机四条装备线，僚机加攻击与分数。 | 纵版射击模式里「僚机」形态很自然——但樱夜不能把它卖成数值。 | GameRes《深度分析〈雷霆战机〉如何让用户付费》；7723 新手攻略 |
| **怪物弹珠** | 每年约 200 个新角色、限定/联动卡池驱动收入；进化→神化→獣神化，獣神化增加第二个技能和果实槽；有创意规范保证角色「らしさ」。2024 年流水约 5.7 亿美元。 | 「同一角色多阶段形态」在日本市场被验证，但它是**角色数量 × 形态**，不是只靠 3 个角色。 | game-rack；teemo.dev 怪物弹珠扭蛋；Wikipedia；Cocoda / mixi 设计博客 |
| **蛋仔派对** | 纯外观扭蛋 + 赛季通行证 + 潮流值社交；累计手游流水约 7.5 亿美元，98% 来自中国；2023 年峰值 3.96 亿后，2024 年 1.83 亿、2025 年 1.59 亿。 | **纯外观变现能成**，但靠的是超大 DAU + 社交展示（UGC、派对）；单机/离线没有社交展示，天花板低得多。 | PocketGamer.biz；mobilegamer.biz |
| **英雄联盟** | 官方立场：「绝不通过外观出售强度」；2020 年约 120–140 个皮肤/年；Ezreal 皮肤平均销量约为 Ivern 的 10 倍；200 美元的皮肤不可能比 20 美元好 10 倍，否则破坏「玩法清晰度」。 | ① 皮肤销量高度集中在**热门角色** → 3 个角色反而集中；② 高价皮肤受「清晰度」限制：特效不能遮挡判定（与樱夜的闪烁测试一致）；③ 需要每年上百个皮肤的产能。 | LoL 官方 /dev「Business Model in 2023」「State of Skins and Events」；第三方营收估计（shanethegamer，非官方） |
| **王者荣耀** | 收入主要来自皮肤，尤其限定、传说、典藏；传说皮肤含完整特效、回城、待机、死亡表现和专属播报；春节限定和 IP 联动是峰值。 | 「特效升级层级」（普通 → 史诗 → 传说：动作 + 特效 + 播报）是外观分层定价的模板。 | 腾讯新闻；易采游戏网（可靠性一般） |
| **原神 名片/角色故事** | 好感 10 级解锁角色名片，纯装饰；角色故事随好感解锁。 | 「角色故事卡片」作为**好感/游玩奖励**比作为付费品更符合玩家预期 **[推断]**；可以卖「典藏版」故事卡（带 Live 立绘、语音）。 | Pro Game Guides；Genshin Wiki「Namecard」 |
| **赛马娘** | 同一角色出多个**不同服装/版本**作为独立可抽单位（有玩法差异），加支援卡；日本营收约 25 亿美元+。 | 「同角色不同版本」的强变现先例——但它们**带强度差异**；樱夜要坚持不卖数值，就只能卖到「版本外观」这一层。 | GameRefinery 拆解；PocketGamer.biz |
| **鬼泣 魔人化 / 贝优妮塔 3 恶魔假面** | 魔人化：计量条耗尽前变身，提升属性、回血、改招式；恶魔假面：和当前武器绑定的恶魔融合，新招式与移动，有独立魔力条，满条放「狂暴」。 | 局内变身的标准做法：**计量条 + 时限 + 武器绑定 + 外观大变**。Boss 阶段触发变身可借鉴这一节奏。 | PlatinumGames 官方博客；DMC/Bayonetta Wiki |

## 2. 只靠外观/形态变现：成功与失败

**成功（且共同前提）**
1. 英雄联盟、王者荣耀：超大在线规模 + 对战展示（别人看得到你的皮肤）+ 每年上百个皮肤的产能 + 上百名英雄分散口味。（LoL 官方 /dev；腾讯新闻）
2. 蛋仔派对：社交展示 + UGC + 赛季通行证，同样依赖超大 DAU；峰值后两年流水下降一半以上。（PocketGamer.biz）
3. 死亡细胞：外观不卖，卖的是**内容 DLC**——买断制下靠「新内容」持续收入。（Steam DLC 页）

**失败 / 吃力**
1. **Knockout City**：从 20 美元买断转免费 + 外观内购，留存与付费不足，2023-06 关服；小团队无法在维持运营的同时做系统性改动。（官方公告；GameSpot；Game Developer）
2. **Concord**：上线 11 天关服，外观内购计划没机会验证（规模不足是主因）。（FandomWire）
3. **2XKO**：格斗游戏小圈子里高价皮肤销售不及预期。（The Escapist）
4. 结论 **[推断]**：外观变现的收入 ≈ DAU × 展示欲 × 角色偏好集中度 × 新品频率。樱夜是**离线单机、无社交展示、只有 3 个角色**，前两项都很弱；靠外观长期支撑的风险很高，需要配合「内容扩展/通行证/形态剧情」。

## 3. 对用户方案的主要启发（详见 DESIGN_V5 §4）
- 形态本身应该**局内可得**（Hades、往世乐土、模拟宇宙都如此），否则就是卖强度；付费卖形态的**外观升级层级**（王者荣耀传说皮肤式）与**剧情/典藏故事卡**。
- 用「规则型形态」（Brotato 式）和「主形态 + 兼容副形态」（模拟宇宙式）控制组合数量，避免平衡爆炸。
- 外观变现天花板低，建议加：①内容扩展包（死亡细胞式：新章节/新 Boss/新模式，含专属形态剧情）②赛季通行证（外观 + 故事卡）③可选目标扭蛋（弹壳特攻队式，保底透明）。

## 4. 来源列表
- RPG Site — Hades Infernal Arms & Weapon Aspects guide: https://www.rpgsite.net/feature/10254-hades-infernal-arms-weapon-aspects-guideevery-weapon-aspect-and-upgrade-unlock
- Hades Wiki — Infernal Arms: https://hades.fandom.com/wiki/Infernal_Arms ；Mirror of Night: https://hades.fandom.com/wiki/Mirror_of_Night
- Game Design Lab — Hades Weapon Aspects: https://teemo.dev/game-design/hades/systems/weapon-aspects-and-in-run-upgrades/
- Reddit r/houkai3rd — Elysian Realm signet guide: https://www.reddit.com/r/houkai3rd/comments/u6yqz5/56_elysian_realm_signet_recommendations/ ；rentry: https://rentry.co/RealmElysian
- Honkai Impact 3 Wiki — Costume Shop: https://honkaiimpact3.fandom.com/wiki/Costume_Shop ；Outfits: https://honkaiimpact3.fandom.com/wiki/Outfits
- Prima Games — Swarm Disaster Path Resonance Interplays: https://primagames.com/tips/all-path-resonance-interplays-in-honkai-star-rail ；HSR Wiki Swarm Disaster: https://honkai-star-rail.fandom.com/wiki/Simulated_Universe:_Swarm_Disaster
- Arknights Terra Wiki — Integrated Strategies: https://arknights.wiki.gg/wiki/Integrated_Strategies
- Dead Cells Wiki — Outfits: https://deadcells.wiki.gg/wiki/Outfits ；Steam DLC: https://store.steampowered.com/dlc/588650/Dead_Cells/
- Game Design Lab — Brotato characters: https://teemo.dev/game-design/brotato/systems/characters-reference/
- mobilegamer.biz — Survivor.io $250m IAP: https://mobilegamer.biz/data-drop-survivor-io-midcore-market-intel-nfl-rivals-mags-financials-dragon-quest-indias-gaming-boom-and-more/ ；Gamesforum: https://www.globalgamesforum.com/news-media/how-survivor.io-continues-to-pull-in-5-million-a-month-three-years-later ；Gamigion: https://www.gamigion.com/survivor-io-the-progressive-monetization-masterclass/ ；Naavik: https://naavik.co/deep-dives/survivorio-archeros-footsteps/
- GameRes — 深度分析《雷霆战机》如何让用户付费: https://www.gameres.com/286540.html
- 怪物弹珠：https://game-rack.com/en/articles/en-monstrike-10-years-success-strategies-1031 ；https://en.wikipedia.org/wiki/Monster_Strike ；https://teemo.dev/game-design/concepts/gacha-games/systems/monster-strike/
- 蛋仔派对：https://www.pocketgamer.biz/eggy-party-cracks-750m-in-mobile-player-spending/ ；https://mobilegamer.biz/neteases-eggy-party-is-closing-in-on-1bn-and-taking-a-crack-at-fortnite-and-roblox/
- LoL /dev Business Model 2023: https://www.leagueoflegends.com/en-au/news/dev/dev-league-s-business-model-in-2023/ ；State of Skins: https://www.leagueoflegends.com/en-gb/news/dev/state-of-skins-and-events/ ；第三方估计: https://www.shanethegamer.com/research/league-of-legends-facts/
- 王者荣耀：https://news.qq.com/rain/a/20250112A070IY00
- 原神名片：https://progameguides.com/genshin-impact/how-to-get-and-change-namecards-in-genshin-impact/ ；https://genshin-impact.fandom.com/wiki/Namecard
- 赛马娘：https://www.gamerefinery.com/umamusume-pretty-derby-deconstruction/ ；https://www.pocketgamer.biz/umamusume-pretty-derby-races-to-100m-on-mobile-in-one-year-overseas/
- 贝优妮塔 3 恶魔假面：https://www.platinumgames.com/official-blog/article/12577 ；https://bayonetta.fandom.com/wiki/Demon_Masquerade ；鬼泣魔人化: https://devilmaycry.fandom.com/wiki/Devil_Trigger
- Knockout City：https://www.knockoutcity.com/updates/knockout-city-special-announcement ；https://www.gamespot.com/articles/knockout-city-dev-explains-what-went-wrong/1100-6512063/ ；https://www.gamedeveloper.com/business/knockout-city-is-shutting-down-after-struggling-to-retain-players
- Concord：https://fandomwire.com/concord-further-after-a-price-tag-of-40-makes-it/ ；2XKO：https://www.escapistmagazine.com/news-fgc-dont-buy-2xko-skins/
