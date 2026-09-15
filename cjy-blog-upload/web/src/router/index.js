import { createRouter, createWebHashHistory } from 'vue-router'
import { SECTIONS } from '../api/client'

// GitHub Pages 无服务端路由支持，使用 hash 模式保证刷新不 404。
// 栏目路由由 SECTIONS 元数据自动生成，新增栏目无需改路由。
const sectionKeys = Object.keys(SECTIONS)

const routes = [
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
  ...sectionKeys.map((key) => ({
    path: `/${key}`,
    name: key,
    component: () => import('../views/ListView.vue'),
    props: { section: key }
  })),
  {
    path: `/:section(${sectionKeys.join('|')})/:slug`,
    name: 'article',
    component: () => import('../views/ArticleView.vue'),
    props: true
  },
  { path: '/tags/:tag?', name: 'tags', component: () => import('../views/TagsView.vue'), props: true },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue') }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  linkActiveClass: 'active',
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  }
})

export default router
