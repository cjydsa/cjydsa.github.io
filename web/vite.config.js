import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// cjydsa.github.io 为用户主页仓库，部署在根路径
export default defineConfig({
  base: '/',
  plugins: [vue()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
