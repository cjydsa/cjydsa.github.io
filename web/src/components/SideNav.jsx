import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu } from 'antd'
import {
  HomeOutlined, FolderOutlined, BellOutlined, LineChartOutlined,
  EditOutlined, ReadOutlined, FileTextOutlined, MessageOutlined, TagsOutlined
} from '@ant-design/icons'
import { loadSite } from '../store'
import { SECTIONS, HOME_COLUMNS } from '../api/client'

const COLUMN_ICONS = {
  daily: <BellOutlined />,
  reports: <LineChartOutlined />,
  notes: <EditOutlined />,
  papers: <ReadOutlined />,
  snippets: <FileTextOutlined />,
  posts: <MessageOutlined />
}

export default function SideNav({ onNavigate }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [site, setSite] = useState(null)

  useEffect(() => { loadSite().then(setSite).catch(() => {}) }, [])

  const items = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    { key: '/projects', icon: <FolderOutlined />, label: '项目' },
    {
      type: 'group',
      label: '专栏',
      children: HOME_COLUMNS.map((key) => ({
        key: '/' + key,
        icon: COLUMN_ICONS[key],
        label: SECTIONS[key].auto
          ? <span className="menu-label">{SECTIONS[key].name}<span className="menu-auto">AUTO</span></span>
          : SECTIONS[key].name
      }))
    },
    { key: '/tags', icon: <TagsOutlined />, label: '标签' }
  ]

  const selectedKey = location.pathname === '/' ? '/' : '/' + location.pathname.split('/')[1]

  return (
    <div className="sidenav">
      <Link to="/" className="brand" onClick={onNavigate}>
        {site && site.owner && site.owner.avatar && (
          <img className="brand-avatar" src={site.owner.avatar} alt="avatar" />
        )}
        <span className="brand-text">
          <span className="brand-name">{(site && site.siteName) || 'cjy.log'}</span>
          <span className="brand-sub">Personal Workspace</span>
        </span>
      </Link>

      <Menu
        className="sidenav-menu"
        mode="inline"
        items={items}
        selectedKeys={[selectedKey]}
        onClick={({ key }) => {
          navigate(key)
          if (onNavigate) onNavigate()
        }}
      />

      <div className="sidenav-foot">
        <span>© {new Date().getFullYear()} cjy</span>
        <span className="sidenav-foot-sub">React 19 · Ant Design 6</span>
      </div>
    </div>
  )
}
