import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// cjydsa.github.io 为用户主页仓库，部署在根路径
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1200
  }
})
