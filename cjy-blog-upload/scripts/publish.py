#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
publish.py — 内容上传/发布接口（供本地与 WorkBuddy 自动化统一调用）

任何来源（手写、AI 生成、其他工具产出）的 Markdown，只要经过本脚本，
就会被校验、规范化放入对应栏目目录，并重新生成前端消费的 JSON API。

用法:
  python scripts/publish.py <section> <file.md> [--slug NAME] [--date YYYY-MM-DD]

  section   栏目: daily | reports | projects | notes | papers | snippets | posts
  file.md   待发布的 Markdown 文件（可位于任意路径）
  --slug    URL 标识，默认取文件名（建议英文/数字/连字符，如 rag-notes-01）
  --date    覆盖 frontmatter 中的日期；frontmatter 缺 date 时自动补今天

示例（AI 每日快报的接入方式）:
  自动化流程生成快报 -> 保存为 daily-2026-09-16.md ->
  python scripts/publish.py daily daily-2026-09-16.md --slug 2026-09-16
  -> git add . && git commit && git push  （Actions 自动构建上线）

校验规则:
  - 必须有 frontmatter（--- 包裹）；缺 title 报错，缺 date 自动补今天
  - tags / summary / pinned 可选，但建议填写 summary（列表与搜索展示用）
"""

import argparse
import re
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SECTIONS = ["daily", "reports", "projects", "notes", "papers", "snippets", "posts"]

FM_RE = re.compile(r"^\ufeff?---\s*\r?\n(.*?)\r?\n---\s*\r?\n?", re.DOTALL)
SLUG_RE = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9._-]*$")


def fail(msg: str, code: int = 1):
    print(f"[publish] 错误: {msg}", file=sys.stderr)
    sys.exit(code)


def main():
    parser = argparse.ArgumentParser(description="发布 Markdown 到指定栏目并重建内容 API")
    parser.add_argument("section", choices=SECTIONS, help="目标栏目")
    parser.add_argument("file", help="Markdown 文件路径")
    parser.add_argument("--slug", help="URL slug（默认取文件名）")
    parser.add_argument("--date", help="覆盖 frontmatter 中的日期，格式 YYYY-MM-DD")
    args = parser.parse_args()

    src = Path(args.file).resolve()
    if not src.is_file():
        fail(f"文件不存在: {src}")

    slug = args.slug or src.stem
    if not SLUG_RE.match(slug):
        fail(f"slug 不合法: {slug!r}（仅限字母、数字、连字符、点、下划线）")

    raw = src.read_text(encoding="utf-8")
    m = FM_RE.match(raw)
    if not m:
        fail("缺少 frontmatter（文件需以 --- 开头，参见 content/ 下各栏目的 _template.md）")

    fm_text = m.group(1)
    body = raw[m.end():]

    # 校验 title
    if not re.search(r"^title\s*:\s*\S", fm_text, re.MULTILINE):
        fail("frontmatter 缺少 title")

    # 补全/覆盖 date
    date = args.date or datetime.now().strftime("%Y-%m-%d")
    if re.search(r"^date\s*:.*$", fm_text, re.MULTILINE):
        if args.date:
            fm_text = re.sub(r"^date\s*:.*$", f"date: {date}", fm_text, count=1, flags=re.MULTILINE)
    else:
        fm_text = fm_text.rstrip() + f"\ndate: {date}"

    # draft 提醒（不拦截，但打印提示）
    if re.search(r"^draft\s*:\s*true\s*$", fm_text, re.MULTILINE | re.IGNORECASE):
        print("[publish] 提示: draft: true，该内容不会发布上线")

    dest_dir = ROOT / "content" / args.section
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / f"{slug}.md"
    if dest.exists():
        print(f"[publish] 覆盖已存在的内容: content/{args.section}/{slug}.md")

    dest.write_text(f"---\n{fm_text.strip()}\n---\n\n{body.lstrip()}", encoding="utf-8")
    print(f"[publish] 已写入 content/{args.section}/{slug}.md")

    # 重建内容 API
    result = subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "build_content.py")],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
    )
    sys.stdout.write(result.stdout)
    if result.returncode != 0:
        sys.stderr.write(result.stderr)
        fail("内容 API 重建失败", result.returncode)

    print(f"[publish] 完成。本地预览: cd web && npm run dev；上线: git add . && git commit -m \"add {args.section}/{slug}\" && git push")


if __name__ == "__main__":
    main()
