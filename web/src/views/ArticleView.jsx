import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Anchor, Button, Card, Divider, Result, Skeleton, Tag } from 'antd'
import { ArrowLeftOutlined, GithubOutlined } from '@ant-design/icons'
import { api, formatDate, readingTime, SECTIONS } from '../api/client'
import { loadList } from '../store'
import MarkdownView from '../components/MarkdownView'

export default function ArticleView() {
  const { section, slug } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [error, setError] = useState('')
  const [headings, setHeadings] = useState([])
  const [nav, setNav] = useState({ newer: null, older: null })

  const sectionName = SECTIONS[section] ? SECTIONS[section].name : section

  useEffect(() => {
    let alive = true
    setItem(null)
    setError('')
    setHeadings([])
    setNav({ newer: null, older: null })
    ;(async () => {
      try {
        const [detail, list] = await Promise.all([api.item(section, slug), loadList(section)])
        if (!alive) return
        setItem(detail)
        document.title = `${detail.title} · ${sectionName}`
        const idx = list.findIndex((it) => it.slug === slug)
        if (idx >= 0) {
          setNav({
            newer: idx > 0 ? list[idx - 1] : null,
            older: idx < list.length - 1 ? list[idx + 1] : null
          })
        }
      } catch (e) {
        if (alive) setError('文章不存在或加载失败：' + e.message)
      }
    })()
    return () => { alive = false }
  }, [section, slug]) // eslint-disable-line react-hooks/exhaustive-deps

  const onRendered = useCallback((list) => setHeadings(list), [])

  const anchorItems = useMemo(
    () => headings.map((h) => ({
      key: h.id,
      href: '#' + h.id,
      title: h.text,
      className: h.level === 'h3' ? 'anchor-sub' : ''
    })),
    [headings]
  )

  if (error) {
    return (
      <Result
        status="404"
        title="404"
        subTitle={error}
        extra={<Button type="primary" onClick={() => navigate('/')}>回到首页</Button>}
      />
    )
  }
  if (!item) {
    return <Skeleton active paragraph={{ rows: 10 }} />
  }

  return (
    <div className="article-layout">
      <div className="article-main">
        <Button type="text" icon={<ArrowLeftOutlined />} className="article-back" onClick={() => navigate('/' + section)}>
          返回{sectionName}
        </Button>
        <h1 className="article-title">{item.title}</h1>
        <div className="article-meta">
          {item.date && <span>{formatDate(item.date)}</span>}
          <span>{readingTime(item.markdown)}</span>
          {item.link && (
            <a className="article-repo" href={item.link} target="_blank" rel="noopener noreferrer">
              <GithubOutlined /> GitHub 仓库
            </a>
          )}
        </div>
        <div className="article-tags">
          {(item.tags || []).map((t) => (
            <Tag key={t} className="tag-link" onClick={() => navigate('/tags/' + encodeURIComponent(t))}>{t}</Tag>
          ))}
        </div>
        <Divider />
        <MarkdownView markdown={item.markdown} onRendered={onRendered} />

        {(nav.newer || nav.older) && (
          <div className="article-nav">
            {nav.older ? (
              <Card hoverable className="nav-card" onClick={() => navigate('/' + section + '/' + encodeURIComponent(nav.older.slug))}>
                <div className="nav-dir">← 上一篇（更早）</div>
                <div className="nav-title">{nav.older.title}</div>
              </Card>
            ) : <span />}
            {nav.newer ? (
              <Card hoverable className="nav-card next" onClick={() => navigate('/' + section + '/' + encodeURIComponent(nav.newer.slug))}>
                <div className="nav-dir">下一篇（更新）→</div>
                <div className="nav-title">{nav.newer.title}</div>
              </Card>
            ) : <span />}
          </div>
        )}
      </div>

      {headings.length >= 2 && (
        <aside className="article-aside">
          <div className="toc-title">本页目录</div>
          <Anchor
            items={anchorItems}
            offsetTop={80}
            onClick={(e, link) => {
              e.preventDefault()
              const id = link && link.href ? link.href.replace(/^#/, '') : ''
              const el = document.getElementById(id)
              if (el) el.scrollIntoView({ behavior: 'smooth' })
            }}
          />
        </aside>
      )}
    </div>
  )
}
