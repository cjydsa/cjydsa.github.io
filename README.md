# cjy.log — 个人博客

前后端分离架构的 GitHub Pages 个人博客：

- **前端** `web/`：Vue 3 + Vite + Vue Router 单页应用（SPA）
- **"后端"** `scripts/` + `web/public/api/`：构建期内容数据管线，把 Markdown 编译成 JSON API，前端通过 `fetch` 消费（GitHub Pages 无法运行动态服务，这是 Pages 上前后端分离的标准做法；未来可随时替换为真实后端，前端业务组件零改动）

## 目录结构

```
├── content/                  # 内容源（Markdown，带 frontmatter）
│   ├── daily/                # AI 每日快报（外部自动化更新）
│   ├── reports/              # 个人学习报告（外部自动化更新）
│   ├── projects/             # 项目展示
│   ├── notes/                # 学习记录
│   ├── papers/               # 论文精读
│   ├── snippets/             # 代码片段
│   └── posts/                # 经验分享
├── scripts/
│   ├── build_content.py      # 内容管线：Markdown -> web/public/api/*.json
│   └── publish.py            # 统一发布接口：校验 + 入库 + 重建 API
├── site.config.json          # 站点配置（主页信息 / 教育 / 经历 / 技能）
├── web/                      # 前端工程（Vue 3 + Vite）
│   ├── public/api/           # 生成的 JSON API（构建产物）
│   └── src/
│       ├── api/client.js     # 取数入口 + 栏目元数据（SECTIONS）
│       ├── views/            # 页面：首页 / 列表 / 文章 / 标签 / 404
│       └── components/       # 组件：导航 / 搜索 / 卡片 / Markdown 渲染等
└── .github/workflows/deploy.yml   # 推送 main 自动构建并部署 Pages
```

## 部署到 cjydsa.github.io

1. 在 GitHub 创建仓库 **`cjydsa/cjydsa.github.io`**（公开）
2. 推送本目录：

   ```bash
   git init
   git add .
   git commit -m "init blog"
   git branch -M main
   git remote add origin https://github.com/cjydsa/cjydsa.github.io.git
   git push -u origin main
   ```

3. 仓库 **Settings → Pages → Source** 选择 **GitHub Actions**
4. 等待 `Build & Deploy` 工作流完成，访问 <https://cjydsa.github.io>

## 内容更新（Markdown 约定）

每个 Markdown 文件带 frontmatter：

```markdown
---
title: 标题            # 必填
date: 2026-09-15      # 列表排序依据（publish.py 会自动补今天）
tags: [RAG, LLM]      # 可选，标签筛选/聚合
summary: 一句话摘要    # 可选，列表与搜索展示
pinned: true          # 可选，精选置顶（首页"精选项目"取 projects 中 pinned 项）
draft: true           # 可选，不发布
---

正文 Markdown（GFM：表格、代码高亮、任务列表等）
```

- 文件名（不含 `.md`）即 URL slug：`#/{栏目}/{文件名}`
- 以 `_` 开头的文件（如 `_template.md`）不会发布

### 发布方式一：手动

直接把 `.md` 放入对应 `content/{栏目}/`，推送即可（CI 自动重建 API）。

### 发布方式二：统一发布接口（推荐，自动化也走这里）

```bash
python scripts/publish.py notes ~/Desktop/rag学习笔记.md --slug rag-notes-01
```

`publish.py` 会校验 frontmatter、补齐日期、放入栏目目录并重建本地 API。
**WorkBuddy 定时自动化**（如 AI 每日快报、每周学习报告）只需：生成 Markdown → 调用该接口 → `git push`。

## 本地开发

```bash
python scripts/build_content.py   # 生成 web/public/api/
cd web
npm install
npm run dev                        # http://localhost:5173
```

## 扩展一个新栏目

1. `content/` 下建同名目录，放 `_template.md`
2. `scripts/build_content.py` 的 `SECTIONS` 列表加一项
3. `web/src/api/client.js` 的 `SECTIONS` 加元数据（名称/图标/描述）

路由、导航、搜索、标签聚合会自动生效，无需改其他代码。
