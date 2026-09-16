# cjy.log — 个人主页 / 工程笔记系统

源码仓库，部署于 **GitHub Pages**：<https://cjydsa.github.io>

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | React 19 · Ant Design 6 · React Router 7 · Vite 8（Rolldown） |
| 内容后端 | Python 3 内容管线（构建期生成静态 JSON API，零第三方依赖） |
| 部署 | GitHub Actions 自动构建并发布到 GitHub Pages |

前端通过 fetch 消费 `/api/*.json` 接口，形态与 REST 后端一致；
未来若接入真实后端（Spring Boot / Node / Serverless），只需替换 `web/src/api/client.js` 的实现，界面零改动。

## 目录结构

```
content/          Markdown 内容库（daily/reports/projects/notes/papers/snippets/posts）
scripts/
  build_content.py   内容管线：content/*.md -> web/public/api/*.json
  publish.py         统一发布接口（外部自动化调用，如 AI 每日快报）
web/               React 前端（Vite）
.github/workflows/ 部署工作流
```

## 内容更新

在 `content/{栏目}/` 下放一个带 frontmatter 的 `.md` 文件并推送即可：

```markdown
---
title: 文章标题
date: 2026-09-16
tags: [RAG, LLM]
summary: 一句话摘要
pinned: true        # 可选，置顶/精选
link: https://...   # 可选，卡片点击直达外链（如 GitHub 仓库）
draft: true         # 可选，草稿不发布
---

正文 Markdown ...
```

- 文件名即 slug，URL 为 `#/{栏目}/{slug}`
- `_` 开头的文件与 `draft: true` 不参与构建
- 自动化发布（AI 每日快报等）：`python scripts/publish.py <栏目> <文件.md> --slug <slug>`

## 本地开发

```bash
python scripts/build_content.py   # 生成 JSON API
cd web && npm ci && npm run dev   # 启动前端
```

## 部署

推送到 `main` 分支即可。Actions 会依次执行：内容管线 → `npm ci && npm run build` → 发布 `web/dist` 到 Pages。

## 新增栏目

1. `content/` 下建同名目录
2. `scripts/build_content.py` 的 `SECTIONS` 列表加一项
3. `web/src/api/client.js` 的 `SECTIONS` 加元数据（名称/图标/描述）

路由、导航、搜索、标签聚合会自动生效，无需改其他代码。
