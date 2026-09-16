import { createHashRouter } from 'react-router-dom'
import App from './App'
import HomeView from './views/HomeView'
import ListView from './views/ListView'
import ArticleView from './views/ArticleView'
import TagsView from './views/TagsView'
import NotFoundView from './views/NotFoundView'

// GitHub Pages 无服务端路由支持，使用 hash 路由保证刷新不 404。
// 栏目路由使用动态段，由 ListView/ArticleView 内部按 SECTIONS 元数据校验。
export const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomeView /> },
      { path: 'tags/:tag?', element: <TagsView /> },
      { path: ':section', element: <ListView /> },
      { path: ':section/:slug', element: <ArticleView /> },
      { path: '*', element: <NotFoundView /> }
    ]
  }
])
