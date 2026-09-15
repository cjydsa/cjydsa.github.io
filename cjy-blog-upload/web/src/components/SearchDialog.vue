<template>
  <teleport to="body">
    <div v-if="modelValue" class="search-overlay" @click.self="close">
      <div class="search-box">
        <div class="search-input-wrap">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
          <input ref="inputRef" v-model="query" type="text" placeholder="搜索项目、笔记、文章…  (Esc 关闭)"
            @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)" @keydown.enter.prevent="openCurrent" />
          <kbd class="kbd">esc</kbd>
        </div>
        <div class="search-results">
          <template v-if="results.length">
            <a v-for="(r, i) in results" :key="r.section + '/' + r.slug" class="search-result-item"
              :class="{ selected: i === cursor }" :href="'#/' + r.section + '/' + encodeURIComponent(r.slug)"
              @click="close" @mouseenter="cursor = i">
              <span class="sr-type">{{ sectionName(r.section) }}</span>
              <div class="sr-title">{{ r.title }}</div>
              <div v-if="r.summary" class="sr-summary">{{ r.summary }}</div>
            </a>
          </template>
          <div v-else class="search-empty">
            {{ query ? '没有匹配「' + query + '」的内容' : '输入关键词开始搜索' }}
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { loadSearchIndex } from '../store'
import { SECTIONS } from '../api/client'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const query = ref('')
const cursor = ref(0)
const inputRef = ref(null)
const index = ref([])

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return index.value.slice(0, 8)
  return index.value
    .filter((it) => [it.title, it.summary, (it.tags || []).join(' ')].join(' ').toLowerCase().includes(q))
    .slice(0, 20)
})

function sectionName(s) {
  return SECTIONS[s] ? SECTIONS[s].name : s
}

function close() {
  emit('update:modelValue', false)
}

function move(delta) {
  if (!results.value.length) return
  cursor.value = (cursor.value + delta + results.value.length) % results.value.length
}

function openCurrent() {
  const r = results.value[cursor.value]
  if (!r) return
  close()
  router.push(`/${r.section}/${encodeURIComponent(r.slug)}`)
}

watch(() => props.modelValue, async (open) => {
  if (!open) return
  query.value = ''
  cursor.value = 0
  try {
    index.value = await loadSearchIndex()
  } catch (e) {
    console.error(e)
  }
  await nextTick()
  inputRef.value && inputRef.value.focus()
})

watch(query, () => { cursor.value = 0 })
</script>
