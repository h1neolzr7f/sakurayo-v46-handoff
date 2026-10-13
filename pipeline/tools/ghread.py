"""GitHub 正文/仓库检索 —— 绕开失效的网页版抓取。

背景：直接抓 github.com 网页版会拿到导航栏或空内容（网页版经代理会被 Cloudflare 拦）。
本工具走 GitHub REST API（直连，不带代理），按优先级尝试：

  1. GET /repos/{owner}/{repo}/readme        -> 自动识别默认分支的 README
  2. GET /repos/{owner}/{repo}/contents/{p}  -> 任意文件
  3. raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}  -> 兜底

鉴权走环境变量 GITHUB_TOKEN，或用本机 settings 里已存的 token（只读用，不打印）。

用法:
  python ghread.py <owner/repo 或 URL>                     # 打印 README
  python ghread.py <owner/repo> --file docs/QUICKSTART.md  # 打印指定文件
  python ghread.py <owner/repo> --meta                     # 只打印仓库元信息
  python ghread.py <owner/repo> --list                     # 列出根目录文件
  python ghread.py "关键词" --search                       # 搜索仓库
"""

import json
import os
import re
import subprocess
import sys
import urllib.parse

API = "https://api.github.com"
# 本机 GitHub 直连正常、走代理反而 403，因此强制不走代理
NO_PROXY = ["-c", "http.proxy=", "-c", "https.proxy="]


def find_token() -> str:
    tok = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if tok:
        return tok.strip()
    # 回退：从 DSH 设置里找之前存过的 token
    for p in (
        os.path.expanduser(r"~\.dsh\settings.yaml"),
        os.path.expanduser(r"~\.dsh\.env"),
    ):
        try:
            with open(p, encoding="utf-8", errors="ignore") as f:
                m = re.search(r"ghp_[A-Za-z0-9]{30,}", f.read())
                if m:
                    return m.group(0)
        except OSError:
            pass
    return ""


def curl(url: str, raw: bool = False, token: str = "") -> tuple[int, str]:
    """用系统 curl 取内容（直连）。返回 (状态码, 文本)。"""
    args = ["curl.exe", "-sSL", "--noproxy", "*", "--max-time", "45", "-w", "\n__CODE__%{http_code}"]
    if token:
        args += ["-H", f"Authorization: Bearer {token}"]
    args += ["-H", "Accept: application/vnd.github.raw" if raw else "Accept: application/vnd.github+json"]
    args.append(url)
    try:
        r = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace")
    except OSError as e:
        return 0, f"curl 调用失败: {e}"
    out = r.stdout or ""
    m = re.search(r"__CODE__(\d+)\s*$", out)
    code = int(m.group(1)) if m else 0
    body = out[: m.start()] if m else out
    return code, body


def parse_repo(s: str) -> tuple[str, str]:
    s = s.strip()
    m = re.search(r"github\.com/([^/]+)/([^/#?\s]+)", s)
    if m:
        return m.group(1), re.sub(r"\.git$", "", m.group(2))
    parts = s.split("/")
    if len(parts) >= 2:
        return parts[0], re.sub(r"\.git$", "", parts[1])
    raise SystemExit(f"无法解析仓库: {s!r}（应为 owner/repo 或 GitHub URL）")


def meta(owner: str, repo: str, token: str) -> dict:
    code, body = curl(f"{API}/repos/{owner}/{repo}", token=token)
    if code != 200:
        raise SystemExit(f"取仓库信息失败 HTTP {code}: {body[:200]}")
    return json.loads(body)


def fetch_readme(owner: str, repo: str, token: str) -> str:
    code, body = curl(f"{API}/repos/{owner}/{repo}/readme", raw=True, token=token)
    if code == 200 and body.strip():
        return body
    # 兜底：raw + 常见分支名
    for br in ("main", "master"):
        code2, body2 = curl(f"https://raw.githubusercontent.com/{owner}/{repo}/{br}/README.md")
        if code2 == 200 and body2.strip():
            return body2
    return f"(README 获取失败: API HTTP {code})"


def fetch_file(owner: str, repo: str, path: str, token: str) -> str:
    code, body = curl(f"{API}/repos/{owner}/{repo}/contents/{urllib.parse.quote(path)}", raw=True, token=token)
    if code == 200 and body.strip():
        return body
    for br in ("main", "master"):
        code2, body2 = curl(f"https://raw.githubusercontent.com/{owner}/{repo}/{br}/{path}")
        if code2 == 200 and body2.strip():
            return body2
    return f"(文件 {path} 获取失败: HTTP {code})"


def list_root(owner: str, repo: str, token: str) -> None:
    code, body = curl(f"{API}/repos/{owner}/{repo}/contents/", token=token)
    if code != 200:
        print(f"列举失败 HTTP {code}: {body[:200]}")
        return
    for it in json.loads(body):
        print(f"  {it['type']:4} {it.get('size', 0):>9} {it['name']}")


def search_repos(q: str, token: str) -> None:
    code, body = curl(f"{API}/search/repositories?q={urllib.parse.quote(q)}&sort=stars&per_page=12", token=token)
    if code != 200:
        print(f"搜索失败 HTTP {code}: {body[:200]}")
        return
    for it in json.loads(body).get("items", []):
        print(f"  ★{it['stargazers_count']:<6} {it['full_name']}")
        print(f"          {(it.get('description') or '')[:110]}")


def main() -> int:
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        return 1

    token = find_token()
    target = args[0]

    if "--search" in args:
        print(f"=== 搜索: {target} (token={'有' if token else '无'}) ===")
        search_repos(target, token)
        return 0

    owner, repo = parse_repo(target)
    print(f"=== {owner}/{repo} (token={'有' if token else '无'}) ===")

    if "--meta" in args:
        m = meta(owner, repo, token)
        print(f"  ★{m.get('stargazers_count')}  fork {m.get('forks_count')}  "
              f"分支 {m.get('default_branch')}  语言 {m.get('language')}")
        print(f"  更新: {m.get('pushed_at')}")
        print(f"  简介: {m.get('description')}")
        return 0

    if "--list" in args:
        print("=== 根目录 ===")
        list_root(owner, repo, token)
        return 0

    if "--file" in args:
        path = args[args.index("--file") + 1]
        print(f"=== {path} ===")
        print(fetch_file(owner, repo, path, token))
        return 0

    print(fetch_readme(owner, repo, token))
    return 0


if __name__ == "__main__":
    sys.exit(main())
