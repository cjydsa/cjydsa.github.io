import { ref, watch } from 'vue'

const initial = document.documentElement.getAttribute('data-theme') || 'light'
const theme = ref(initial)

watch(theme, (t) => {
  document.documentElement.setAttribute('data-theme', t)
  try { localStorage.setItem('theme', t) } catch (e) { /* 隐私模式下忽略 */ }
})

export function useTheme() {
  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }
  return { theme, toggle }
}
