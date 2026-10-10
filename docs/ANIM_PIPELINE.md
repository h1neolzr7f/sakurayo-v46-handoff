# 动画流水线（tools/anim-pipeline）

目标：用中转站的 gpt-image-2 生成或编辑立绘及其差分，然后自动完成拆层、抠图、对齐、网格与变形权重，最后导出游戏能直接加载的数据（`rig.js`、`base.webp`、`atlas.webp`）。整个过程一条命令跑完，只用 CPU。
第一个落地场景是大厅看板娘（三位角色），之后同一套流程会复用到形态变身立绘、剧情立绘、战斗精灵和敌人。

```
python tools/anim-pipeline/run.py rig --name sayo --base art/characters/sayo/default/lobby_idle.webp --gen
```

| 阶段 | 做什么 | 工具 |
|---|---|---|
| gen | 并行发起 6 个编辑任务。每种差分出 a/b 两版：闭眼、张嘴、开心、害羞。另外两张是语义 mask：头发涂纯品红、裙摆涂纯青 | 中转站 gpt-image-2（`/images/edits`） |
| cutout | 原图没有透明通道时抠图 | rembg `isnet-anime`（MIT） |
| face | 定位动漫人脸框 | nagadomi/lbpcascade_animeface（MIT，OpenCV 级联，CPU 只要几毫秒） |
| align | 在人脸框内用 ECC 仿射配准差分。之后做差、闭运算、羽化，得到补丁 mask，a/b 两版中保留残差小的那一版 | OpenCV（Apache-2.0） |
| landmarks | 从闭眼补丁的连通域定位双眼，从张嘴补丁定位嘴，再推出头心、颈点、胸点 | 自研 |
| depth | 估计相对深度，头部转向时近处位移更大，产生视差 | Depth Anything V2 Small（Apache-2.0，CPU 约 3 s） |
| regions | 生成头、发、裙、胸、上半身、眼和深度的权重场。头发和裙摆直接用 gpt-image-2 的纯色 mask，黑发配黑衣也能分开 | 自研 + OpenCV |
| export | 40×60 网格，每个顶点带 7 路权重（uint8/base64），补丁打成图集 | Pillow |

运行时放在 `src/runtime/sakurayo-rig.js`：用 WebGL1 做网格变形，主网格加每个补丁一张 10×10 子网格，补丁共用同一个变形场，表情做交叉淡入。没有 WebGL 时退回 Canvas2D（静态图，表情仍会切换）。

- 运动全部来自顶点权重，脚底权重为 0，不再有整图平移或弹跳。
- 呼吸周期 3.6 s，作用在胸口和肩膀。眨眼间隔 2–5 s，18% 的概率连眨两下。头发和裙摆是二阶弹簧，受头部速度和风影响。
- 头部绕颈点旋转，平移量乘以深度得到视差，视线落在眼区。指针、陀螺仪都能驱动视线。
- 点击不同部位的反应：头→开心 + 歪头，头发→害羞 + 甩发，胸口→害羞 + 后仰，裙摆→害羞 + 裙摆摆动，其他部位→说话。
- 闲置时每 12–22 s 随机播一个动作：伸懒腰、整理发夹（侧头 + 说话 + 发梢抖动）、东张西望。

## 调研（2026-10）

| 项目 | 许可证 | 单图输入 | 脚本/API | Web 运行时 | CPU | 结论 |
|---|---|---|---|---|---|---|
| facebookresearch/AnimatedDrawings | MIT（代码+权重），已归档 | ✔（检测→分割→姿态→骨架） | ✔ Python；但检测/姿态要 TorchServe Docker | ✘ 输出 GIF/MP4，ARAP 在 Python/OpenGL | 可（慢） | 适合儿童画式全身动作重定向（BVH）。对精细动漫立绘效果一般，而且没有 Web 运行时。**未选**；后续做敌人全身 BVH 动作时可以借用 ARAP 思路 |
| shitagaki-lab/see-through | Apache-2.0 | ✔ 最多拆 23 层，补全被遮挡部分，输出 PSD | ✔ `inference_psd.py` | ✘（输出 PSD） | ✘ 依赖 SDXL 级 LayerDiff、Marigold，实际需要大显存 GPU | 拆层质量最好，本机 CPU 跑不动。流水线已留好 `layers` 阶段接口，有 GPU 后可以替换 regions 阶段，实现真正分层 |
| Depth Anything V2 Small | Apache-2.0（Small） | ✔ | ✔ transformers / transformers.js | ✔（WASM） | ✔ | **采用**，用于深度视差权重 |
| rembg（isnet-anime） | MIT | ✔ | ✔ | — | ✔ | **采用**，用于抠图 |
| nagadomi/lbpcascade_animeface | MIT | ✔ | ✔ OpenCV | — | ✔ | **采用**，用于人脸框 |
| DragonBones JS / pixi-dragonbones-runtime | MIT | ✘（需要编辑器出 `_ske.json`） | 数据格式开放，可以用脚本生成 | ✔ Pixi 7–8 | ✔ | 可以作为导出目标。目前未接入，原因是游戏是单文件 Canvas2D，引入 Pixi 加运行时约 600 KB。`rig.js` 的网格加权重可以按需转成 DragonBones 的 mesh + bone 数据 |
| Spine 运行时（spine-pixi） | Spine Runtimes License（要求持有 Spine 编辑器授权） | ✘ | — | ✔ | ✔ | **不采用**，许可证不适合 |
| PixiJS MeshPlane / MeshRope | MIT | — | ✔ | ✔ | ✔ | 原理与本项目自写的 WebGL1 网格相同。自写版不到 300 行，没有额外依赖 |
| Live2D Cubism SDK | 专有许可证（按收入分档） | ✘ 需要手工绑定 | — | ✔ | ✔ | **不采用**，需要手工 rig，许可证也有限制 |
| Anima2dToDragonBones | 未声明 | — | ✔ Python 生成 `_ske.json` | — | ✔ | 参考了它的 DragonBones JSON 生成方式 |

**最终选择**：gpt-image-2 负责差分和语义 mask，OpenCV、rembg、Depth Anything V2 负责自动配准和权重，导出自研的 rig 格式，由自写 WebGL1 网格运行时播放。
这套组合可以离线、在 CPU 上运行，许可证都很宽松（MIT/Apache），Android WebView 只需 WebGL1，没有新增大依赖。

## 复用计划
- 形态变身立绘：`--base characters/<c>/forms/<slot>.webp`，差分和 mask 自动生成，cut-in 时可以用 rig 代替静态图。
- 剧情立绘：用 AVG 的 `avg_*.webp` 生成 rig，说话时由 `say()` 驱动口型。
- 战斗精灵和敌人：同一网格运行时加关键帧参数曲线，例如呼吸、受击后仰、攻击前倾，可以替代或补充 RIFE 补帧。全身大动作后续可以引入 AnimatedDrawings 风格的骨架和 ARAP。
- 分层：GPU 可用时接入 See-through，用拆出的 PSD 图层替代颜色 mask，补全被遮挡的后发，做出真正的多层视差。

## 兼容与降级
- WebGL1 用 `failIfMajorPerformanceCaveat` 创建；若创建失败（无 WebGL、软件渲染被拒）或发生 `webglcontextlost`，就切换到 Canvas2D：不做网格，只保留以脚底为锚的呼吸缩放、眨眼和表情补丁。加上 `?rig=2d` 可以强制使用 2D。rig 数据加载失败时退回原来的 `lobby_idle.webp` 静态层。
- `tests/mascot_sizes_smoke.mjs` 覆盖三角色 × 三种尺寸（1280×720、390×844@2x、1024×768）× 两种渲染路径（WebGL/2D）。
