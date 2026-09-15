#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_content.py — 内容数据管线（构建期"后端"）

扫描 content/ 下的 Markdown 文件，生成一套静态 JSON API 到 web/public/api/，
前端 SPA 通过 fetch 消费这些接口，与调用真实 REST 后端完全一致。

内容目录约定（每个目录对应一个 JSON 接口 /api/content/{section}.json）:
    content/
      daily/      AI 每日快报（外部自动化经 scripts/publish.py 更新）
      reports/    个人学习报告（外部自动化经 scripts/publish.py 更新）
      projects/   项目展示
      notes/      学习记录
      papers/     论文精读
      snippets/   代码片段
      posts/      经验分享

Markdown 文件头部使用 YAML 风格 frontmatter:

    ---
    title: 文章标题
    date: 2026-09-15
    tags: [RAG, LLM]
    summary: 一句话摘要（列表页与搜索结果展示）
    pinned: true          # 可选，置顶/精选
    draft: true           # 可选，草稿不发布
    ---

    正文 Markdown ...

规则:
  - 文件名（不含扩展名）即 slug，URL 为 #/{section}/{slug}
  - 以 "_" 开头的文件（如 _template.md）与 draft: true 的文件不参与构建
  - 列表按 date 倒序排列
  - 零第三方依赖，Python 3.8+ 标准库即可运行

扩展新内容类型:
  1. 在下方 SECTIONS 中加一项；2. 建 content/{section}/ 目录；
  3. 在 web/src/api/client.js 的 SECTIONS 加元数据（路由/导航/搜索自动生效）。
"""

import json
import re
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / "content"
OUT_DIR = ROOT / "web" / "public" / "api"
SITE_CONFIG = ROOT / "site.config.json"

SECTIONS = ["daily", "reports", "projects", "notes", "papers", "snippets", "posts"]

FRONTMATTER_RE = re.compile(r"^\ufeff?---\s*\r?\n(.*?)\r?\n---\s*\r?\n?", re.DOTALL)


# ---------------------------------------------------------------- frontmatter

def _parse_scalar(value: str):
    v = value.strip()
    if not v:
        return ""
    if v.startswith("[") and v.endswith("]"):
        inner = v[1:-1].strip()
        if not inner:
            return []
        return [_parse_scalar(x) for x in inner.split(",")]
    if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
        return v[1:-1]
    low = v.lower()
    if low == "true":
        return True
    if low == "false":
        return False
    return v


def parse_frontmatter(raw: str):
    """解析 YAML 风格的简单 frontmatter，返回 (meta: dict, body: str)。"""
    m = FRONTMATTER_RE.match(raw)
    if not m:
        return {}, raw
    meta = {}
    current_key = None
    for line in m.group(1).splitlines():
        if not line.strip() or line.strip().startswith("#"):
            continue
        # 支持 "- item" 形式的多行列表
        stripped = line.strip()
        if stripped.startswith("- ") and current_key:
            meta.setdefault(current_key, [])
            if isinstance(meta[current_key], list):
                meta[current_key].append(_parse_scalar(stripped[2:]))
            continue
        if ":" in line:
            key, _, value = line.partition(":")
            key = key.strip()
            current_key = key
            meta[key] = _parse_scalar(value)
    return meta, raw[m.end():]


# ---------------------------------------------------------------- build

def build_section(section: str):
    """构建单个栏目的列表索引与详情接口，返回列表项。"""
    section_dir = CONTENT_DIR / section
    items = []
    if not section_dir.is_dir():
        return items

    detail_dir = OUT_DIR / "content" / section
    detail_dir.mkdir(parents=True, exist_ok=True)

    for md_file in sorted(section_dir.glob("*.md")):
        if md_file.name.startswith("_"):
            continue  # 模板文件
        raw = md_file.read_text(encoding="utf-8")
        meta, body = parse_frontmatter(raw)

        if meta.get("draft") is True:
            continue

        slug = md_file.stem
        item = {
            "slug": slug,
            "title": str(meta.get("title") or slug),
            "date": str(meta.get("date") or ""),
            "tags": meta.get("tags") if isinstance(meta.get("tags"), list) else [],
            "summary": str(meta.get("summary") or ""),
            "pinned": bool(meta.get("pinned")),
        }
        # 可选外链（如 GitHub 仓库），存在时前端卡片点击直接跳转外链
        if meta.get("link"):
            item["link"] = str(meta["link"])
        items.append(item)

        detail = dict(item)
        detail["section"] = section
        detail["markdown"] = body.strip()
        (detail_dir / f"{slug}.json").write_text(
            json.dumps(detail, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    # 日期倒序（无日期的排最后），pinned 优先
    items.sort(key=lambda x: (not x["pinned"], x["date"] or "0000"), reverse=False)
    items.sort(key=lambda x: x["date"] or "0000", reverse=True)
    items.sort(key=lambda x: not x["pinned"])

    (OUT_DIR / "content").mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "content" / f"{section}.json").write_text(
        json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return items


def build_tags(all_items):
    """标签聚合接口: /api/tags.json"""
    tags = {}
    for section, items in all_items.items():
        for it in items:
            for t in it["tags"]:
                tags.setdefault(t, []).append({
                    "section": section,
                    "slug": it["slug"],
                    "title": it["title"],
                    "date": it["date"],
                })
    (OUT_DIR / "tags.json").write_text(
        json.dumps(tags, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return tags


def build_search(all_items):
    """全文搜索索引接口: /api/search.json"""
    index = []
    for section, items in all_items.items():
        for it in items:
            index.append({
                "section": section,
                "slug": it["slug"],
                "title": it["title"],
                "summary": it["summary"],
                "tags": it["tags"],
                "date": it["date"],
            })
    (OUT_DIR / "search.json").write_text(
        json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def main():
    # 全量重建：清空输出目录，保证删除的源文件不会残留为过期接口
    if OUT_DIR.is_dir():
        shutil.rmtree(OUT_DIR)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # 站点配置 -> /api/site.json
    if SITE_CONFIG.is_file():
        site = json.loads(SITE_CONFIG.read_text(encoding="utf-8"))
    else:
        site = {}
        print("[warn] site.config.json 不存在，使用空配置", file=sys.stderr)
    site["generatedAt"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    (OUT_DIR / "site.json").write_text(
        json.dumps(site, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    all_items = {}
    total = 0
    for section in SECTIONS:
        items = build_section(section)
        all_items[section] = items
        total += len(items)
        print(f"[build] {section:10s} -> {len(items)} 篇")

    tags = build_tags(all_items)
    build_search(all_items)

    print(f"[build] tags              -> {len(tags)} 个")
    print(f"[build] done. 共 {total} 篇内容，API 输出至 {OUT_DIR.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
