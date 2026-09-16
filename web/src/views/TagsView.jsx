import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Col, Empty, Row, Tag, Typography } from 'antd'
import { api } from '../api/client'
import EntryCard from '../components/EntryCard'

export default function TagsView() {
  const { tag } = useParams()
  const navigate = useNavigate()
  const [tagsMap, setTagsMap] = useState({})

  useEffect(() => { api.tags().then(setTagsMap).catch(() => {}) }, [])

  const tagList = useMemo(
    () => Object.keys(tagsMap)
      .map((name) => ({ name, count: tagsMap[name].length }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    [tagsMap]
  )

  const entries = useMemo(() => {
    if (!tag || !tagsMap[tag]) return []
    return [...tagsMap[tag]].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [tag, tagsMap])

  return (
    <div className="tags-page">
      <div className="page-head">
        <Typography.Title level={2} style={{ marginBottom: 4 }}>{tag ? '# ' + tag : '标签'}</Typography.Title>
        <p className="page-desc">{tag ? '包含该标签的全部内容' : '按标签浏览所有内容'}</p>
      </div>

      {!tag ? (
        tagList.length ? (
          <div className="tag-cloud">
            {tagList.map((t) => (
              <Tag key={t.name} className="cloud-tag" onClick={() => navigate('/tags/' + encodeURIComponent(t.name))}>
                {t.name}<span className="cloud-count">{t.count}</span>
              </Tag>
            ))}
          </div>
        ) : (
          <Empty description="还没有任何标签" />
        )
      ) : (
        <>
          <div className="list-count">共 {entries.length} 篇</div>
          {entries.length ? (
            <Row gutter={[16, 16]}>
              {entries.map((e) => (
                <Col key={e.section + '/' + e.slug} xs={24} sm={12} xl={8}>
                  <EntryCard section={e.section} item={e} />
                </Col>
              ))}
            </Row>
          ) : (
            <Empty description="没有找到相关内容" />
          )}
        </>
      )}
    </div>
  )
}
