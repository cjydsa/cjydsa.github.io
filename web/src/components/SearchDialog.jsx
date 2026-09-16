import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Empty, Input, Modal } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { loadSearchIndex } from '../store'
import { SECTIONS } from '../api/client'

export default function SearchDialog({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const [index, setIndex] = useState([])
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    setQuery('')
    setCursor(0)
    loadSearchIndex().then(setIndex).catch(() => {})
    const t = setTimeout(() => inputRef.current && inputRef.current.focus(), 80)
    return () => clearTimeout(t)
  }, [open])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return index.slice(0, 8)
    return index
      .filter((it) => [it.title, it.summary, (it.tags || []).join(' ')].join(' ').toLowerCase().includes(q))
      .slice(0, 20)
  }, [query, index])

  useEffect(() => { setCursor(0) }, [query])

  const sectionName = (s) => (SECTIONS[s] ? SECTIONS[s].name : s)

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (results.length) setCursor((c) => (c + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (results.length) setCursor((c) => (c - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const r = results[cursor]
      if (r) {
        onClose()
        navigate(`/${r.section}/${encodeURIComponent(r.slug)}`)
      }
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={600}
      centered={false}
      style={{ top: '12vh' }}
      className="search-modal"
      styles={{ body: { padding: 12 } }}
    >
      <Input
        ref={inputRef}
        size="large"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        prefix={<SearchOutlined />}
        placeholder="搜索项目、笔记、文章…  (Esc 关闭)"
        allowClear
      />
      <div className="search-results">
        {results.length ? (
          results.map((r, i) => (
            <a
              key={r.section + '/' + r.slug}
              className={'search-result-item' + (i === cursor ? ' selected' : '')}
              href={'#/' + r.section + '/' + encodeURIComponent(r.slug)}
              onClick={onClose}
              onMouseEnter={() => setCursor(i)}
            >
              <span className="sr-type">{sectionName(r.section)}</span>
              <div className="sr-title">{r.title}</div>
              {r.summary && <div className="sr-summary">{r.summary}</div>}
            </a>
          ))
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={query ? `没有匹配「${query}」的内容` : '输入关键词开始搜索'}
            style={{ padding: '24px 0' }}
          />
        )}
      </div>
    </Modal>
  )
}
