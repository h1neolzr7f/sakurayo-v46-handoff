# 安全说明

## 报告问题

请不要在公开 Issue 里粘贴：

- 签名密钥、keystore 密码、`local.properties`
- 完整存档 JSON 或本机绝对路径
- 你从别处拿到的「破解包」或未知证书 APK

安全问题请用 GitHub 的 [Private vulnerability reporting](https://github.com/h1neolzr7f/sakurayo-zombietide/security/advisories/new) 提交，或只描述复现步骤、不带私人数据。

## 项目边界

- 游戏默认离线，不申请账号、通讯录或读取全部已装应用
- 存档只写本机；旧档缺字段补齐，不会为了升级清空进度
- 仓库已忽略 `*.jks`、`*.keystore`、`android-app/signing/`、`keystore.properties`、`local.properties` 和 `*.apk`
- Release APK 使用维护者自己的正式证书；克隆源码后需要你自己的密钥才能打签名包
