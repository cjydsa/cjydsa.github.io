import { reactive } from 'vue'
import { api } from './api/client'

/**
 * 轻量全局状态：站点配置 + 各栏目列表缓存。
 * 数据来自构建期生成的 JSON API（见 scripts/build_content.py）。
 */
export const store = reactive({
  site: null,
  lists: { projects: null, notes: null, posts: null },
  searchIndex: null,
  error: null
})

export async function loadSite() {
  if (store.site) return store.site
  store.site = await api.site()
  document.title = store.site.siteName || 'cjy.log'
  return store.site
}

export async function loadList(section) {
  if (!store.lists[section]) {
    store.lists[section] = await api.list(section)
  }
  return store.lists[section]
}

export async function loadSearchIndex() {
  if (!store.searchIndex) {
    store.searchIndex = await api.search()
  }
  return store.searchIndex
}
