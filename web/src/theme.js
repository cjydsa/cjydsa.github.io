// 主题管理：light / dark，写入 data-theme 属性并持久化到 localStorage
export function getInitialTheme() {
  try {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch (e) { /* 隐私模式下忽略 */ }
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t)
  try { localStorage.setItem('theme', t) } catch (e) { /* 忽略 */ }
}
