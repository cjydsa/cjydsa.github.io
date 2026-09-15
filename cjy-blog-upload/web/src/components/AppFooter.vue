<template>
  <footer class="site-footer">
    <div class="container footer-inner">
      <span>© {{ year }} {{ name }} · Vue 3 + Markdown API · GitHub Pages</span>
      <span class="footer-mono" v-if="generated">content updated: {{ generated }}</span>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import { store } from '../store'
import { formatDate } from '../api/client'

const year = new Date().getFullYear()
const name = computed(() => (store.site && store.site.owner && store.site.owner.displayName) || 'cjy')
const generated = computed(() => (store.site && store.site.generatedAt) ? formatDate(store.site.generatedAt) : '')
</script>
