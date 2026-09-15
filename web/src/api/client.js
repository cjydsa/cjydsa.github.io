/**
 * API 客户端 —— 前端唯一的取数入口。
 *
 * 后端 = 构建期由 scripts/build_content.py 生成的静态 JSON API，
 * 接口形态与 REST 后端一致；未来若接入真实后端（Serverless / 云服务），
 * 只需修改本文件的实现，业务组件零改动。
 *
 * 端点一览:
 *   GET /api/site.json                        站点配置（主页信息、经历、技能）
 *   GET /api/content/{section}.json           栏目列表（projects|notes|posts）
 *   GET /api/content/{section}/{slug}.json    内容详情（含 markdown 正文）
 *   GET /api/tags.json                        标签聚合
 *   GET /api/search.json                      搜索索引
 */

const BASE = import.meta.env.BASE_URL + 'api'

async function get(path) {
  const res = await fetch(BASE + path)
  if (!res.ok) {
    throw new Error(`API ${path} 请求失败: HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  site: () => get('/site.json'),
  list: (section) => get(`/content/${section}.json`),
  item: (section, slug) => get(`/content/${section}/${encodeURIComponent(slug)}.json`),
  tags: () => get('/tags.json'),
  search: () => get('/search.json')
}

/* ---------------- 工具 ---------------- */

export function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function readingTime(text) {
  const cn = (text.match(/[一-龥]/g) || []).length
  const en = (text.match(/[a-zA-Z]+/g) || []).length
  const mins = Math.max(1, Math.round(cn / 400 + en / 200))
  return `${mins} min`
}

/**
 * 栏目定义 —— 前端路由、导航、列表页共用这一份元数据。
 * 新增栏目时：1) 在 content/ 建同名目录；2) 在 scripts/build_content.py 的 SECTIONS 注册；
 * 3) 在这里加一条元数据。路由与导航会自动生效。
 */
export const SECTIONS = {
  daily: { name: 'AI 每日快报', icon: '📰', auto: true, desc: 'AI 每天自动汇总的行业热点、论文速递与开源动态。' },
  reports: { name: '学习报告', icon: '📊', auto: true, desc: '周期性个人学习复盘，由 AI 汇总当周学习产出自动生成。' },
  notes: { name: '学习记录', icon: '✏️', desc: '技术学习过程中的笔记与沉淀。' },
  papers: { name: '论文精读', icon: '📄', desc: '论文阅读笔记：问题、方法、结果与我的理解。' },
  snippets: { name: '代码片段', icon: '💻', desc: '可复用的代码片段与关键实现细节。' },
  posts: { name: '经验分享', icon: '💡', desc: '实习、求职与工程落地中的经验与思考。' },
  projects: { name: '项目', icon: '🛠', desc: '做过的项目与工程实践。' }
}

/** 首页「固定专栏」区展示的栏目及顺序 */
export const HOME_COLUMNS = ['daily', 'reports', 'notes', 'papers', 'snippets', 'posts']
