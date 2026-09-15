<template>
  <router-link class="entry-card" :to="'/' + section + '/' + encodeURIComponent(item.slug)">
    <div class="entry-card-header">
      <span class="entry-card-title">{{ item.title }}</span>
      <span v-if="item.pinned" class="pin-badge">pinned</span>
    </div>
    <div class="entry-card-meta">
      <span>{{ sectionName }}</span>
      <span v-if="item.date">{{ formatDate(item.date) }}</span>
    </div>
    <p v-if="item.summary" class="entry-card-summary">{{ item.summary }}</p>
    <div class="entry-card-tags">
      <span v-for="t in item.tags" :key="t" class="tag">{{ t }}</span>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'
import { formatDate, SECTIONS } from '../api/client'

const props = defineProps({
  section: { type: String, required: true },
  item: { type: Object, required: true }
})

const sectionName = computed(() => (SECTIONS[props.section] ? SECTIONS[props.section].name : props.section))
</script>
