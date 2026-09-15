<template>
  <header class="site-header">
    <div class="container header-inner">
      <router-link to="/" class="site-logo">
        <span class="logo-prompt">&gt;_</span> {{ siteName }}
      </router-link>

      <nav class="site-nav" :class="{ open: navOpen }" @click="navOpen = false">
        <router-link to="/" exact-active-class="active">首页</router-link>
        <router-link to="/projects">项目</router-link>

        <!-- 专栏下拉（桌面 hover 展开；移动端随菜单展开为平铺列表） -->
        <div class="nav-dropdown" :class="{ open: columnOpen }">
          <button class="nav-dropdown-trigger" @click.stop="columnOpen = !columnOpen">
            专栏
            <svg class="caret" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor"
              stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          <div class="nav-dropdown-menu">
            <router-link v-for="key in columnKeys" :key="key" :to="'/' + key" class="dropdown-item">
              <span class="dropdown-icon">{{ SECTIONS[key].icon }}</span>
              <span>
                <span class="dropdown-name">{{ SECTIONS[key].name }}</span>
                <span v-if="SECTIONS[key].auto" class="auto-badge">auto</span>
                <span class="dropdown-desc">{{ SECTIONS[key].desc }}</span>
              </span>
            </router-link>
          </div>
        </div>

        <!-- 移动端平铺的专栏链接 -->
        <router-link v-for="key in columnKeys" :key="'m-' + key" :to="'/' + key" class="mobile-column-link">
          {{ SECTIONS[key].icon }} {{ SECTIONS[key].name }}
        </router-link>

        <router-link to="/tags">标签</router-link>
      </nav>

      <div class="header-actions">
        <button class="icon-btn" title="搜索 ( / 或 Ctrl+K )" aria-label="搜索" @click="$emit('open-search')">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
        </button>
        <button class="icon-btn" title="切换主题" aria-label="切换主题" @click="toggle">
          <svg v-if="theme === 'light'" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
          <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
        </button>
        <a v-if="github" class="icon-btn" :href="github" target="_blank" rel="noopener" title="GitHub" aria-label="GitHub">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.73.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.68.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" /></svg>
        </a>
        <button class="icon-btn nav-toggle" aria-label="菜单" @click="navOpen = !navOpen">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref } from 'vue'
import { store } from '../store'
import { SECTIONS, HOME_COLUMNS } from '../api/client'
import { useTheme } from '../composables/useTheme'

defineEmits(['open-search'])

const { theme, toggle } = useTheme()
const navOpen = ref(false)
const columnOpen = ref(false)

const columnKeys = HOME_COLUMNS

const siteName = computed(() => (store.site && store.site.siteName) || 'cjy.log')
const github = computed(() => store.site && store.site.owner && store.site.owner.github)
</script>
