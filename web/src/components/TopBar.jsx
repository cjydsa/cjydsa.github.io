import { useEffect, useState } from 'react'
import { Button, Tooltip } from 'antd'
import { GithubOutlined, MenuOutlined, MoonOutlined, SearchOutlined, SunOutlined } from '@ant-design/icons'
import { loadSite } from '../store'

export default function TopBar({ title, isMobile, dark, onToggleTheme, onOpenSearch, onOpenDrawer }) {
  const [github, setGithub] = useState('')

  useEffect(() => {
    loadSite().then((s) => setGithub((s && s.owner && s.owner.github) || '')).catch(() => {})
  }, [])

  return (
    <div className="topbar">
      {isMobile && <Button type="text" icon={<MenuOutlined />} onClick={onOpenDrawer} aria-label="菜单" />}
      <div className="topbar-title">{title}</div>

      <button className="topbar-search" onClick={onOpenSearch}>
        <SearchOutlined />
        <span className="topbar-search-text">搜索内容…</span>
        <span className="topbar-kbd">Ctrl K</span>
      </button>

      <Tooltip title={dark ? '切换到浅色模式' : '切换到深色模式'}>
        <Button type="text" icon={dark ? <SunOutlined /> : <MoonOutlined />} onClick={onToggleTheme} aria-label="切换主题" />
      </Tooltip>

      {github && (
        <Tooltip title="GitHub">
          <Button type="text" icon={<GithubOutlined />} href={github} target="_blank" aria-label="GitHub" />
        </Tooltip>
      )}
    </div>
  )
}
