import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Col, Empty, Result, Row, Skeleton, Tag, Typography } from 'antd'
import { loadList } from '../store'
import { SECTIONS } from '../api/client'
import EntryCard from '../components/EntryCard'

export default function ListView() {
  const { section } = useParams()
  const meta = SECTIONS[section]
  const [items, setItems] = useState(null)
  const [activeTag, setActiveTag] = useState('')

  useEffect(() => {
    setActiveTag('')
    setItems(null)
    if (meta) {
      loadList(section).then(setItems).catch(() => setItems([]))
    }
  }, [section]) // eslint-disable-line react-hooks/exhaustive-deps

  const allTags = useMemo(() => {
    const s = new Set()
    ;(items || []).forEach((it) => (it.tags || []).forEach((t) => s.add(t)))
    return Array.from(s).sort()
  }, [items])

  const filtered = useMemo(
    () => (activeTag ? (items || []).filter((it) => (it.tags || []).includes(activeTag)) : items || []),
    [items, activeTag]
  )

  const grouped = useMemo(() => {
    const groups = []
    let currentYear = null
    for (const it of filtered) {
      const year = (it.date || '').slice(0, 4) || ''
      if (year !== currentYear) {
        groups.push({ year, items: [] })
        currentYear = year
      }
      groups[groups.length - 1].items.push(it)
    }
    return groups
  }, [filtered])

  if (!meta) {
    return <Result status="404" title="404" subTitle="这个栏目不存在" />
  }

  return (
    <div className="list-page">
      <div className="page-head">
        <Typography.Title level={2} style={{ marginBottom: 4 }}>{meta.name}</Typography.Title>
        <p className="page-desc">{meta.desc}</p>
      </div>

      {allTags.length > 0 && (
        <div className="filter-bar">
          <Tag.CheckableTag checked={!activeTag} onChange={() => setActiveTag('')}>all</Tag.CheckableTag>
          {allTags.map((t) => (
            <Tag.CheckableTag key={t} checked={activeTag === t} onChange={(v) => setActiveTag(v ? t : '')}>{t}</Tag.CheckableTag>
          ))}
        </div>
      )}

      {!items ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : (
        <>
          <div className="list-count">共 {filtered.length} 篇</div>
          {filtered.length ? (
            grouped.map((group) => (
              <div key={group.year || 'none'} className="year-group">
                {group.year && <div className="year-divider">{group.year}</div>}
                <Row gutter={[16, 16]}>
                  {group.items.map((it) => (
                    <Col key={it.slug} xs={24} sm={12} xl={8}>
                      <EntryCard section={section} item={it} />
                    </Col>
                  ))}
                </Row>
              </div>
            ))
          ) : (
            <Empty description="这里还是空的">
              <p className="empty-hint">
                {meta.auto
                  ? `本栏目由外部自动化更新：生成 Markdown 后运行 python scripts/publish.py ${section} <文件.md> 入库`
                  : `在 content/${section}/ 下放一个 .md 文件，推送后自动出现在这里`}
              </p>
            </Empty>
          )}
        </>
      )}
    </div>
  )
}
