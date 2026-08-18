# 这个 skill 不是原版 VibeGame

原版：[https://github.com/tettethu/VibeGame](https://github.com/tettethu/VibeGame)  
主页：[https://vibegame.tettet.org](https://vibegame.tettet.org)

## 云端能保证的

- 仓库里的 `.agents/skills/vibegame-playtest/` 会被 Cloud Agent 读到
- 聊天里可输入 `/vibegame-playtest` 手动调用
- 执行者是当前 Cursor Agent 和它的子代理

本仓的 `.gitignore` 忽略了整个 `.cursor/`，所以 skill **必须**放在 `.agents/skills/`，不能放 `.cursor/skills/`。

## 云端不能保证的

- 不会自动启动 Claude Code 或 Codex CLI
- 不会出现 orchestrator / artist / architect / programmer / auditor / player / reviewer 那 8 个外部进程
- 不会把本仓变成 Phaser 工程
- Cursor 订阅额度不会变成 Anthropic / OpenAI / 生图 / VLM 的额度

用户级 skill（本机 `~/.cursor/skills/`）也进不了云端虚拟机。只有提交进本仓的项目级 skill 会跟着仓库走。

## 若用户明确要跑上游 VibeGame

先停下来说明成本，不要默默安装：

1. 另开目录，不要写进樱夜的 `src/`
2. 需要 Python 3.12、`uv`、`tmux`、Playwright，以及 Claude Code 或 Codex
3. 需要 Dashboard Secrets：生图、VLM，以及所选 agent CLI 的密钥
4. 出口若做了 allowlist，还要把对应 API 域名放行
5. 本仓当前 Cloud 会话 **没有绑定 Environment**，所以上游 CLI 不会预装好

默认仍然走本 skill 的对抗验收，继续打磨《樱夜·尸潮》。
