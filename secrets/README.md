# 本地密钥

这个目录只放本机密钥，**不要提交、不要贴到聊天里**。

## NovelAI

1. 打开 NovelAI 账号设置，创建 **Persistent API Token**（不要用邮箱密码）。
2. 复制下面的示例文件为 `secrets/novelai.token`：

```text
secrets/novelai.token.example  →  secrets/novelai.token
```

3. 文件里只留一行 JWT。`#` 开头的行会被忽略。

也可以不建文件，改用本机环境变量：

```powershell
[Environment]::SetEnvironmentVariable('NOVELAI_TOKEN', '你的PersistentToken', 'User')
```

```bash
export NOVELAI_TOKEN='你的PersistentToken'
```

读取顺序：`NOVELAI_TOKEN` → `NAI_TOKEN` → `NOVELAI_ACCESS_KEY` → `secrets/novelai.token` → `secrets/nai.token`。

真实 token 已被 `.gitignore` 排除。过期或不用了就删掉本地文件并在 NovelAI 后台作废该 token。
