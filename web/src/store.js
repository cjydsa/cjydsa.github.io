import { api } from './api/client'

// 轻量数据缓存：站点配置 + 各栏目列表 + 搜索索引
// 数据来源为构建期由 scripts/build_content.py 生成的静态 JSON API
const cache = { site: null, lists: {}, searchIndex: null }

export async function loadSite() {
  if (!cache.site) {
    cache.site = await api.site()
    document.title = cache.site.siteName || 'cjy.log'
  }
  return cache.site
}

export async function loadList(section) {
  if (!cache.lists[section]) {
    cache.lists[section] = await api.list(section)
  }
  return cache.lists[section]
}

export async function loadSearchIndex() {
  if (!cache.searchIndex) {
    cache.searchIndex = await api.search()
  }
  return cache.searchIndex
}
