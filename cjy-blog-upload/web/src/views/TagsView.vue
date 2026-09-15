<template>
  <div class="tags-page">
    <div class="list-page-header">
      <h1 class="list-page-title">{{ tag ? '# ' + tag : '标签' }}</h1>
      <p class="list-page-desc">{{ tag ? '包含该标签的全部内容' : '按标签浏览所有内容' }}</p>
    </div>

    <!-- 标签云 -->
    <div v-if="!tag" class="tag-cloud">
      <router-link v-for="t in tagList" :key="t.name" class="tag" :to="'/tags/' + encodeURIComponent(t.name)">
        {{ t.name }}<span class="tag-count">{{ t.count }}</span>
      </router-link>
      <div v-if="!tagList.length" class="empty-state" style="width:100%">
        还没有任何标签
        <span class="empty-mono">在 Markdown 的 frontmatter 里写 tags: [xxx] 即可</span>
      </div>
    </div>

    <!-- 某标签下的内容 -->
    <template v-else>
      <div class="list-count">// {{ entries.length }} 篇</div>
      <div v-if="entries.length" class="card-list">
        <EntryCard v-for="e in entries" :key="e.section + '/' + e.slug" :section="e.section" :item="e" />
      </div>
      <div v-else class="empty-state">没有找到相关内容</div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '../api/client'
import EntryCard from '../components/EntryCard.vue'

const props = defineProps({
  tag: { type: String, default: '' }
})

const tagsMap = ref({})

const tagList = computed(() =>
  Object.keys(tagsMap.value)
    .map((name) => ({ name, count: tagsMap.value[name].length }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
)

const entries = computed(() => {
  if (!props.tag || !tagsMap.value[props.tag]) return []
  return [...tagsMap.value[props.tag]].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
})

onMounted(async () => {
  try {
    tagsMap.value = await api.tags()
  } catch (e) {
    console.error(e)
  }
})
</script>
