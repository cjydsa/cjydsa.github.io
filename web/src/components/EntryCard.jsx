import { Link } from 'react-router-dom'
import { Card, Tag } from 'antd'
import { formatDate, SECTIONS } from '../api/client'

// 通用条目卡片：有外链（如 GitHub 仓库）时点击直达外链，否则进入站内文章
export default function EntryCard({ section, item }) {
  const sectionName = SECTIONS[section] ? SECTIONS[section].name : section

  const card = (
    <Card className="entry-card" hoverable>
      <div className="entry-card-header">
        <span className="entry-card-title">{item.title}</span>
        {item.link && <Tag color="success" className="entry-badge">↗ repo</Tag>}
        {item.pinned && <Tag color="warning" className="entry-badge">置顶</Tag>}
      </div>
      <div className="entry-card-meta">
        <span>{sectionName}</span>
        {item.date && <span>{formatDate(item.date)}</span>}
        {item.link && <span className="meta-link">{item.link.replace(/^https?:\/\//, '')}</span>}
      </div>
      {item.summary && <p className="entry-card-summary">{item.summary}</p>}
      <div className="entry-card-tags">
        {(item.tags || []).map((t) => <Tag key={t}>{t}</Tag>)}
      </div>
    </Card>
  )

  return item.link ? (
    <a className="entry-card-link" href={item.link} target="_blank" rel="noopener noreferrer">{card}</a>
  ) : (
    <Link className="entry-card-link" to={'/' + section + '/' + encodeURIComponent(item.slug)}>{card}</Link>
  )
}
