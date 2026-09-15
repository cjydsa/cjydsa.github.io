<template>
  <div v-if="site" class="home">
    <!-- Hero：名片式主视觉 -->
    <section class="hero">
      <div class="hero-watermark" aria-hidden="true">{{ site.siteName || 'cjy.log' }}</div>

      <div class="hero-status"><span class="status-dot"></span>{{ statusText }}</div>

      <div class="hero-top">
        <div v-if="site.owner.avatar" class="hero-avatar-wrap">
          <img class="hero-avatar" :src="site.owner.avatar" alt="avatar" />
        </div>
        <div>
          <h1 class="hero-name">{{ site.owner.displayName }}</h1>
          <p class="hero-tagline">
            <span class="prompt">~/cjy $</span>{{ site.owner.tagline }}<span class="caret"></span>
          </p>
        </div>
      </div>

      <p class="hero-bio">{{ site.owner.bio }}</p>

      <div class="hero-links">
        <a v-if="site.owner.github" class="chip-link" :href="site.owner.github" target="_blank" rel="noopener">GitHub ↗</a>
        <a v-if="site.owner.email" class="chip-link" :href="'mailto:' + site.owner.email">Email</a>
        <a v-for="l in site.owner.links || []" :key="l.url" class="chip-link" :href="l.url" target="_blank" rel="noopener">{{ l.name }}</a>
      </div>
    </section>

    <div class="home-layout">
      <!-- 主栏 -->
      <div class="home-main">
        <!-- 固定专栏 -->
        <section class="home-section">
          <h2 class="section-title"><span class="section-index">01</span>固定专栏</h2>
          <div class="column-grid">
            <router-link v-for="c in columns" :key="c.key" class="column-card" :to="'/' + c.key">
              <div class="column-card-top">
                <span class="column-icon">{{ c.icon }}</span>
                <span v-if="c.auto" class="auto-badge">auto</span>
              </div>
              <div class="column-name">{{ c.name }}</div>
              <div class="column-desc">{{ c.desc }}</div>
              <div class="column-meta">
                <span>{{ c.count }} 篇</span>
                <span v-if="c.latest">更新于 {{ c.latest }}</span>
                <span v-else>待更新</span>
              </div>
            </router-link>
          </div>
        </section>

        <!-- 精选项目 -->
        <section v-if="pinned.length" class="home-section">
          <h2 class="section-title">
            <span class="section-index">02</span>精选项目
            <router-link class="section-more" to="/projects">全部项目 →</router-link>
          </h2>
          <div class="card-list">
            <EntryCard v-for="p in pinned" :key="p.slug" section="projects" :item="p" />
          </div>
        </section>

        <!-- 最近更新 -->
        <section v-if="recent.length" class="home-section">
          <h2 class="section-title"><span class="section-index">03</span>最近更新</h2>
          <div class="changelog">
            <a v-for="r in recent" :key="r.section + '/' + r.slug"
              class="ch-row" :class="{ ext: r.link }"
              :href="r.link ? r.link : '#' + '/' + r.section + '/' + encodeURIComponent(r.slug)"
              :target="r.link ? '_blank' : undefined" :rel="r.link ? 'noopener' : undefined">
              <span class="ch-date">{{ formatDate(r.date) }}</span>
              <span class="ch-sec">{{ sectionName(r.section) }}</span>
              <span class="ch-title">{{ r.title }}</span>
              <span v-if="r.link" class="ch-ext">↗ repo</span>
              <span v-else class="ch-arrow">→</span>
            </a>
          </div>
        </section>
      </div>

      <!-- 侧栏 -->
      <aside class="home-aside">
        <TimelineBlock v-if="site.education && site.education.length"
          compact title-en="EDUCATION" title="教育经历" :items="site.education" />
        <SkillGrid v-if="site.skills && site.skills.length" compact :groups="site.skills" />

        <div class="side-card">
          <div class="side-card-title">Site Stats</div>
          <div class="stats-grid">
            <div class="stat">
              <div class="stat-num">{{ stats.total }}</div>
              <div class="stat-label">篇内容 / entries</div>
            </div>
            <div class="stat">
              <div class="stat-num">{{ stats.sections }}</div>
              <div class="stat-label">个栏目 / columns</div>
            </div>
            <div class="stat">
              <div class="stat-num">{{ stats.tags }}</div>
              <div class="stat-label">个标签 / tags</div>
            </div>
            <div class="stat">
              <div class="stat-num">{{ stats.projects }}</div>
              <div class="stat-label">个项目 / repos</div>
            </div>
            <div class="stat wide">
              <div class="stat-num">最近更新 {{ stats.latest }}</div>
              <div class="stat-label">last commit</div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>

  <div v-else-if="error" class="not-found">
    <p class="nf-code">:(</p>
    <p>站点数据加载失败：{{ error }}</p>
    <p class="nf-hint">请确认已运行 <code>python scripts/build_content.py</code> 生成 web/public/api/ 下的接口数据。</p>
  </div>

  <div v-else class="loading"><span class="spinner"></span> loading…</div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { store, loadSite, loadList } from '../store'
import { SECTIONS, HOME_COLUMNS, formatDate } from '../api/client'
import TimelineBlock from '../components/TimelineBlock.vue'
import SkillGrid from '../components/SkillGrid.vue'
import EntryCard from '../components/EntryCard.vue'

const error = ref('')
const site = computed(() => store.site)
const columns = ref([])
const pinned = ref([])
const recent = ref([])
const lists = ref({})

const sectionName = (key) => (SECTIONS[key] ? SECTIONS[key].name : key)

/* 状态徽标：从教育经历推导，如「深圳大学 · 硕士在读」 */
const statusText = computed(() => {
  const edu = site.value && site.value.education && site.value.education[0]
  if (edu) {
    const school = String(edu.school || '').split('·')[0].trim()
    const degree = String(edu.degree || '')
    const stage = /硕士/.test(degree) ? '硕士在读' : /博士/.test(degree) ? '博士在读' : degree
    return [school, stage].filter(Boolean).join(' · ')
  }
  return site.value ? site.value.siteDescription : ''
})

const stats = computed(() => {
  const all = Object.values(lists.value)
  const total = all.reduce((n, l) => n + l.length, 0)
  const tags = new Set()
  let latest = ''
  all.forEach((l) => l.forEach((it) => {
    (it.tags || []).forEach((t) => tags.add(t))
    if ((it.date || '') > latest) latest = it.date
  }))
  return {
    total,
    sections: Object.keys(SECTIONS).length,
    tags: tags.size,
    projects: (lists.value.projects || []).filter((p) => p.link).length,
    latest: latest ? formatDate(latest) : '—'
  }
})

onMounted(async () => {
  try {
    await loadSite()
    const allLists = {}
    await Promise.all(Object.keys(SECTIONS).map(async (key) => {
      allLists[key] = await loadList(key)
    }))
    lists.value = allLists

    // 固定专栏卡片：数量 + 最近更新日期
    columns.value = HOME_COLUMNS.map((key) => {
      const list = allLists[key] || []
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

    pinned.value = (allLists.projects || []).filter((p) => p.pinned).slice(0, 4)

    recent.value = Object.keys(SECTIONS)
      .flatMap((key) => (allLists[key] || []).map((it) => ({ ...it, section: key })))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 8)
  } catch (e) {
    error.value = e.message
  }
})
</script>
