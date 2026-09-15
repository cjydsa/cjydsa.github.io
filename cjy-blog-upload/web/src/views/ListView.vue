<template>
  <div class="list-page">
    <div class="list-page-header">
      <h1 class="list-page-title">{{ meta.name }}</h1>
      <p class="list-page-desc">{{ meta.desc }}</p>
    </div>

    <div v-if="allTags.length" class="filter-bar">
      <span class="filter-label">tags:</span>
      <span class="tag filter-tag" :class="{ active: !activeTag }" @click="activeTag = ''">all</span>
      <span v-for="t in allTags" :key="t" class="tag filter-tag" :class="{ active: activeTag === t }"
        @click="activeTag = activeTag === t ? '' : t">{{ t }}</span>
    </div>

    <div class="list-count">// {{ filtered.length }} 篇</div>

    <template v-if="filtered.length">
      <div v-for="group in grouped" :key="group.year" class="year-group">
        <div v-if="group.year" class="year-divider">{{ group.year }}</div>
        <div class="card-list">
          <EntryCard v-for="it in group.items" :key="it.slug" :section="section" :item="it" />
        </div>
      </div>
    </template>

    <div v-else class="empty-state">
      这里还是空的
      <span v-if="meta.auto" class="empty-mono">本栏目由外部自动化更新：生成 Markdown 后运行 python scripts/publish.py {{ section }} &lt;文件.md&gt; 入库</span>
      <span v-else class="empty-mono">在 content/{{ section }}/ 下放一个 .md 文件，推送后自动出现在这里</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { loadList } from '../store'
import { SECTIONS } from '../api/client'
import EntryCard from '../components/EntryCard.vue'

const props = defineProps({
  section: { type: String, required: true }
})

const meta = computed(() => SECTIONS[props.section] || { name: props.section, desc: '' })
const items = ref([])
const activeTag = ref('')

const allTags = computed(() => {
  const s = new Set()
  items.value.forEach((it) => (it.tags || []).forEach((t) => s.add(t)))
  return Array.from(s).sort()
})

const filtered = computed(() =>
  activeTag.value ? items.value.filter((it) => (it.tags || []).includes(activeTag.value)) : items.value
)

// 按年份分组展示
const grouped = computed(() => {
  const groups = []
  let currentYear = null
  for (const it of filtered.value) {
    const year = (it.date || '').slice(0, 4) || ''
    if (year !== currentYear) {
      groups.push({ year, items: [] })
      currentYear = year
    }
    groups[groups.length - 1].items.push(it)
  }
  return groups
})

// 路由在 /projects /notes /posts 间切换时组件会被复用，需要监听 section 变化重新加载
watch(() => props.section, async (section) => {
  activeTag.value = ''
  items.value = await loadList(section)
}, { immediate: true })
</script>
