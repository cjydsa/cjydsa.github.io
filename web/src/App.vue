<template>
  <div class="app-shell">
    <div class="progress-bar" :style="{ width: progress + '%' }"></div>

    <NavBar @open-search="searchOpen = true" />

    <main class="container app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <AppFooter />
    <SearchDialog v-model="searchOpen" />

    <button class="back-to-top" :class="{ visible: showTop }" title="回到顶部" aria-label="回到顶部" @click="toTop">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6" /></svg>
    </button>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import NavBar from './components/NavBar.vue'
import AppFooter from './components/AppFooter.vue'
import SearchDialog from './components/SearchDialog.vue'
import { loadSite } from './store'

const searchOpen = ref(false)
const progress = ref(0)
const showTop = ref(false)

function onScroll() {
  const h = document.documentElement
  const total = h.scrollHeight - h.clientHeight
  progress.value = total > 0 ? (h.scrollTop / total) * 100 : 0
  showTop.value = h.scrollTop > 400
}

function onKeydown(e) {
  const tag = document.activeElement && document.activeElement.tagName
  if ((e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) && !/INPUT|TEXTAREA/.test(tag)) {
    e.preventDefault()
    searchOpen.value = true
  }
}

function toTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(async () => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKeydown)
  try {
    await loadSite()
  } catch (err) {
    // 站点配置加载失败时，各视图会自行展示错误态
    console.error(err)
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onKeydown)
})
</script>
