import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar, Button, Card, Col, Result, Row, Skeleton, Statistic, Tag, Timeline } from 'antd'
import { GithubOutlined } from '@ant-design/icons'
import { loadSite, loadList } from '../store'
import { SECTIONS, HOME_COLUMNS, formatDate } from '../api/client'
import EntryCard from '../components/EntryCard'

export default function HomeView() {
  const [site, setSite] = useState(null)
  const [lists, setLists] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const s = await loadSite()
        const all = {}
        await Promise.all(Object.keys(SECTIONS).map(async (key) => { all[key] = await loadList(key) }))
        if (!alive) return
        setSite(s)
        setLists(all)
      } catch (e) {
        if (alive) setError(e.message)
      }
    })()
    return () => { alive = false }
  }, [])

  const columns = useMemo(() => {
    if (!lists) return []
    return HOME_COLUMNS.map((key) => {
      const list = lists[key] || []
      return {
        key,
        icon: SECTIONS[key].icon,
        name: SECTIONS[key].name,
        desc: SECTIONS[key].desc,
        auto: !!SECTIONS[key].auto,
        count: list.length,
        latest: list.length ? formatDate(list[0].date) : ''
      }
    })
  }, [lists])

  const pinned = useMemo(
    () => (lists ? (lists.projects || []).filter((p) => p.pinned).slice(0, 4) : []),
    [lists]
  )

  const recent = useMemo(() => {
    if (!lists) return []
    return Object.keys(SECTIONS)
      .flatMap((key) => (lists[key] || []).map((it) => ({ ...it, section: key })))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 8)
  }, [lists])

  const stats = useMemo(() => {
    if (!lists) return []
    const all = Object.values(lists)
    const total = all.reduce((n, l) => n + l.length, 0)
    const tags = new Set()
    let latest = ''
    all.forEach((l) => l.forEach((it) => {
      (it.tags || []).forEach((t) => tags.add(t))
      if ((it.date || '') > latest) latest = it.date
    }))
    return [
      { title: '内容篇数', value: total },
      { title: '栏目', value: Object.keys(SECTIONS).length },
      { title: '标签', value: tags.size },
      { title: '最近更新', value: latest ? formatDate(latest) : '—' }
    ]
  }, [lists])

  if (error) {
    return <Result status="error" title="站点数据加载失败" subTitle={error} />
  }
  if (!site || !lists) {
    return <Skeleton active paragraph={{ rows: 8 }} />
  }

  // 状态标签：从教育经历推导，如「深圳大学 · 硕士在读」
  const statusText = (() => {
    const edu = site.education && site.education[0]
    if (edu) {
      const school = String(edu.school || '').split('·')[0].trim()
      const degree = String(edu.degree || '')
      const stage = /硕士/.test(degree) ? '硕士在读' : /博士/.test(degree) ? '博士在读' : degree
      return [school, stage].filter(Boolean).join(' · ')
    }
    return ''
  })()

  const sectionName = (key) => (SECTIONS[key] ? SECTIONS[key].name : key)
  const linkOf = (r) => (r.link ? r.link : '#/' + r.section + '/' + encodeURIComponent(r.slug))

  return (
    <div className="home">
      {/* 个人信息卡 */}
      <Card className="profile-card">
        <div className="profile-main">
          <Avatar size={88} shape="square" src={site.owner.avatar} className="profile-avatar" />
          <div className="profile-info">
            <div className="profile-name-row">
              <h1 className="profile-name">{site.owner.displayName}</h1>
              {statusText && <Tag color="success">{statusText}</Tag>}
            </div>
            <div className="profile-tagline">{site.owner.tagline}</div>
            <p className="profile-bio">{site.owner.bio}</p>
            <div className="profile-links">
              {site.owner.github && (
                <Button size="small" icon={<GithubOutlined />} href={site.owner.github} target="_blank">GitHub</Button>
              )}
              {site.owner.email && <Button size="small" href={'mailto:' + site.owner.email}>Email</Button>}
              {(site.owner.links || []).map((l) => (
                <Button key={l.url} size="small" href={l.url} target="_blank">{l.name}</Button>
              ))}
            </div>
          </div>
          <div className="profile-stats">
            {stats.map((s) => <Statistic key={s.title} title={s.title} value={s.value} />)}
          </div>
        </div>
      </Card>

      {/* 固定专栏 */}
      <section className="sec">
        <div className="sec-head">
          <h2 className="sec-title">固定专栏</h2>
          <span className="sec-sub">COLUMNS</span>
        </div>
        <Row gutter={[16, 16]}>
          {columns.map((c) => (
            <Col key={c.key} xs={24} sm={12} lg={8}>
              <Card className="col-card" hoverable onClick={() => navigate('/' + c.key)}>
                <div className="col-card-head">
                  <span className="col-icon">{c.icon}</span>
                  <span className="col-name">{c.name}</span>
                  {c.auto && <Tag color="processing">AUTO</Tag>}
                </div>
                <div className="col-desc">{c.desc}</div>
                <div className="col-meta">
                  <span>{c.count} 篇</span>
                  <span>{c.latest ? '更新于 ' + c.latest : '待更新'}</span>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      {/* 精选项目 + 最近更新 */}
      <Row gutter={[20, 20]} className="sec">
        <Col xs={24} lg={14}>
          <div className="sec-head">
            <h2 className="sec-title">精选项目</h2>
            <span className="sec-sub">PROJECTS</span>
            <Link className="sec-more" to="/projects">全部项目 →</Link>
          </div>
          <div className="stack">
            {pinned.map((p) => <EntryCard key={p.slug} section="projects" item={p} />)}
          </div>
        </Col>
        <Col xs={24} lg={10}>
          <div className="sec-head">
            <h2 className="sec-title">最近更新</h2>
            <span className="sec-sub">RECENT</span>
          </div>
          <Card>
            <Timeline
              items={recent.map((r) => ({
                children: (
                  <a
                    className="recent-link"
                    href={linkOf(r)}
                    target={r.link ? '_blank' : undefined}
                    rel={r.link ? 'noopener' : undefined}
                  >
                    <span className="recent-date">{formatDate(r.date)}</span>
                    <Tag className="recent-sec">{sectionName(r.section)}</Tag>
                    <span className="recent-title">{r.title}</span>
                    {r.link && <span className="recent-ext">↗</span>}
                  </a>
                )
              }))}
            />
          </Card>
        </Col>
      </Row>

      {/* 教育经历 + 技能栈 */}
      <Row gutter={[20, 20]} className="sec">
        <Col xs={24} md={12}>
          <div className="sec-head">
            <h2 className="sec-title">教育经历</h2>
            <span className="sec-sub">EDUCATION</span>
          </div>
          <Card>
            <Timeline
              items={(site.education || []).map((e, i) => ({
                children: (
                  <div key={i}>
                    <div className="edu-period">{e.period}</div>
                    <div className="edu-org">{e.school}</div>
                    <div className="edu-degree">{e.degree}</div>
                  </div>
                )
              }))}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <div className="sec-head">
            <h2 className="sec-title">技能栈</h2>
            <span className="sec-sub">TECH STACK</span>
          </div>
          <Card>
            {(site.skills || []).map((g) => (
              <div key={g.group} className="skill-group">
                <div className="skill-group-name">{g.group}</div>
                <div>{(g.items || []).map((it) => <Tag key={it} className="skill-tag">{it}</Tag>)}</div>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
