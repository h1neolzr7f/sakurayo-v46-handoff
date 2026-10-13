# 素材管线快照

游戏里实际加载的图和视频在 `android-app/app/src/main/assets/game/art/`。这里是生成它们用的脚本和源帧，方便别的 agent 接着做，不依赖本机那份工作目录。

- `tools/`：生图、抽帧、打包。密钥只从环境变量 `LITANGKING_KEY` 读取，仓库里没有密钥。
- `vendor/imagine-batch-runner/`：Grok 关键帧视频驱动和已下载的原片。浏览器配置文件不在仓库里，换机器要自己登录一次。
- `lab-assets/`：身份帧、关键帧、试画和音效源。

脚本里的绝对路径仍指向原来的本机目录。换机器后先改路径，再跑。一次只开一条 Grok 任务。
