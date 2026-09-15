<template>
  <div v-if="site" class="home">
    <!-- Hero -->
    <section class="hero">
      <img v-if="site.owner.avatar" class="hero-avatar" :src="site.owner.avatar" alt="avatar" />
      <div>
        <h1 class="hero-name">{{ site.owner.displayName }}</h1>
        <p class="hero-tagline">{{ site.owner.tagline }}</p>
        <p class="hero-bio">{{ site.owner.bio }}</p>
        <div class="hero-links">
          <a v-if="site.owner.github" class="chip-link" :href="site.owner.github" target="_blank" rel="noopener">GitHub</a>
          <a v-if="site.owner.email" class="chip-link" :href="'mailto:' + site.owner.email">Email</a>
          <a v-for="l in site.owner.links || []" :key="l.url" class="chip-link" :href="l.url" target="_blank" rel="noopener">{{ l.name }}</a>
        </div>
      </div>
    </section>

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

    <TimelineBlock v-if="site.education && site.education.length" title="教育经历" index="02" :items="site.education" />
    <SkillGrid v-if="site.skills && site.skills.length" index="03" :groups="site.skills" />

    <!-- 精选项目 -->
    <section v-if="pinned.length" class="home-section">
      <h2 class="section-title">
        <span class="section-index">04</span>精选项目
        <router-link class="section-more" to="/projects">全部项目 →</router-link>
      </h2>
      <div class="card-list">
        <EntryCard v-for="p in pinned" :key="p.slug" section="projects" :item="p" />
      </div>
    </section>

    <!-- 最近更新 -->
    <section v-if="recent.length" class="home-section">
      <h2 class="section-title"><span class="section-index">05</span>最近更新</h2>
      <div class="card-list">
        <EntryCard v-for="r in recent" :key="r.section + '/' + r.slug" :section="r.section" :item="r" />
      </div>
    </section>
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

onMounted(async () => {
  try {
    await loadSite()
    const allLists = {}
    await Promise.all(Object.keys(SECTIONS).map(async (key) => {
      allLists[key] = await loadList(key)
    }))

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

    pinned.value = (allLists.projects || []).filter((p) => p.pinned).slice(0, 3)

    recent.value = Object.keys(SECTIONS)
      .flatMap((key) => (allLists[key] || []).map((it) => ({ ...it, section: key })))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 6)
  } catch (e) {
    error.value = e.message
  }
})
</script>
