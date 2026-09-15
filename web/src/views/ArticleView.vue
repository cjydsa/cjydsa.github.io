<template>
  <div v-if="item" class="article-layout">
    <div>
      <div class="article-header">
        <router-link class="article-back" :to="'/' + section">← 返回{{ sectionName }}</router-link>
        <h1 class="article-title">{{ item.title }}</h1>
        <div class="article-meta">
          <span v-if="item.date">{{ formatDate(item.date) }}</span>
          <span>{{ readingTime(item.markdown) }}</span>
        </div>
        <div class="article-tags">
          <a v-if="item.link" class="tag repo-tag" :href="item.link" target="_blank" rel="noopener">↗ GitHub 仓库</a>
          <router-link v-for="t in item.tags" :key="t" class="tag" :to="'/tags/' + encodeURIComponent(t)">{{ t }}</router-link>
        </div>
      </div>

      <MarkdownView :markdown="item.markdown" @rendered="onRendered" />

      <div v-if="newer || older" class="article-nav">
        <router-link v-if="older" :to="'/' + section + '/' + encodeURIComponent(older.slug)">
          <span class="nav-dir">← 上一篇（更早）</span>
          <span class="nav-title">{{ older.title }}</span>
        </router-link>
        <span v-else class="placeholder"></span>
        <router-link v-if="newer" class="next" :to="'/' + section + '/' + encodeURIComponent(newer.slug)">
          <span class="nav-dir">下一篇（更新）→</span>
          <span class="nav-title">{{ newer.title }}</span>
        </router-link>
      </div>
    </div>

    <aside v-if="headings.length >= 2" class="article-toc">
      <div class="toc-title">On this page</div>
      <ul class="toc-list">
        <li v-for="h in headings" :key="h.id">
          <a href="javascript:void(0)" class="toc-link" :class="['toc-' + h.level, { active: h.id === activeHeading }]"
            @click="scrollTo(h.id)">{{ h.text }}</a>
        </li>
      </ul>
    </aside>
  </div>

  <div v-else-if="error" class="not-found">
    <p class="nf-code">404</p>
    <p>{{ error }}</p>
    <p><router-link to="/">← 回到首页</router-link></p>
  </div>

  <div v-else class="loading"><span class="spinner"></span> loading…</div>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { api, formatDate, readingTime, SECTIONS } from '../api/client'
import { loadList } from '../store'
import MarkdownView from '../components/MarkdownView.vue'

const props = defineProps({
  section: { type: String, required: true },
  slug: { type: String, required: true }
})

const item = ref(null)
const error = ref('')
const headings = ref([])
const activeHeading = ref('')
const newer = ref(null)
const older = ref(null)

const sectionName = computed(() => (SECTIONS[props.section] ? SECTIONS[props.section].name : props.section))

function onRendered(list) {
  headings.value = list
  setupSpy()
}

function scrollTo(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

let spyHandler = null
function setupSpy() {
  teardownSpy()
  spyHandler = () => {
    let current = ''
    for (const h of headings.value) {
      const el = document.getElementById(h.id)
      if (el && el.getBoundingClientRect().top < 100) current = h.id
    }
    activeHeading.value = current
  }
  window.addEventListener('scroll', spyHandler, { passive: true })
  spyHandler()
}

function teardownSpy() {
  if (spyHandler) window.removeEventListener('scroll', spyHandler)
  spyHandler = null
}

async function load() {
  item.value = null
  error.value = ''
  headings.value = []
  newer.value = null
  older.value = null
  try {
    const [detail, list] = await Promise.all([
      api.item(props.section, props.slug),
      loadList(props.section)
    ])
    item.value = detail
    document.title = `${detail.title} · ${sectionName.value}`
    const idx = list.findIndex((it) => it.slug === props.slug)
    if (idx >= 0) {
      newer.value = idx > 0 ? list[idx - 1] : null
      older.value = idx < list.length - 1 ? list[idx + 1] : null
    }
  } catch (e) {
    error.value = '文章不存在或加载失败：' + e.message
  }
}

watch(() => [props.section, props.slug], load, { immediate: true })

onUnmounted(teardownSpy)
</script>
