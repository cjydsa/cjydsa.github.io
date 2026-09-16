import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ConfigProvider, Drawer, FloatButton, Layout, theme as antdTheme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import SideNav from './components/SideNav'
import TopBar from './components/TopBar'
import SearchDialog from './components/SearchDialog'
import AppFooter from './components/AppFooter'
import { applyTheme, getInitialTheme } from './theme'
import { SECTIONS } from './api/client'

export default function App() {
  const [dark, setDark] = useState(() => getInitialTheme() === 'dark')
  const [searchOpen, setSearchOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 860)
  const location = useLocation()

  useEffect(() => { applyTheme(dark ? 'dark' : 'light') }, [dark])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 859px)')
    const fn = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  // 路由切换回到顶部
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  // Ctrl/⌘ + K 或 / 打开全局搜索
  useEffect(() => {
    const fn = (e) => {
      const tag = document.activeElement && document.activeElement.tagName
      if ((e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) && !/INPUT|TEXTAREA/.test(tag)) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  const pageTitle = useMemo(() => {
    const seg = location.pathname.split('/').filter(Boolean)
    if (seg.length === 0) return '首页'
    if (seg[0] === 'tags') return '标签'
    const meta = SECTIONS[seg[0]]
    return meta ? meta.name : seg[0]
  }, [location.pathname])

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        cssVar: true,
        algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: { borderRadius: 8 }
      }}
    >
      <Layout className="app-shell" hasSider={!isMobile}>
        {!isMobile && (
          <Layout.Sider width={232} className="app-sider">
            <SideNav />
          </Layout.Sider>
        )}

        <Drawer
          placement="left"
          open={isMobile && drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={248}
          styles={{ body: { padding: 0 } }}
        >
          <SideNav onNavigate={() => setDrawerOpen(false)} />
        </Drawer>

        <Layout className="app-body">
          <Layout.Header className="app-header">
            <TopBar
              title={pageTitle}
              isMobile={isMobile}
              dark={dark}
              onToggleTheme={() => setDark((d) => !d)}
              onOpenSearch={() => setSearchOpen(true)}
              onOpenDrawer={() => setDrawerOpen(true)}
            />
          </Layout.Header>
          <Layout.Content className="app-main">
            <div className="app-content">
              <Outlet />
            </div>
            <AppFooter />
          </Layout.Content>
        </Layout>

        <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
        <FloatButton.BackTop visibilityHeight={400} />
      </Layout>
    </ConfigProvider>
  )
}
