import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { applyTheme, getInitialTheme } from './theme'
import './styles/main.css'
import 'highlight.js/styles/github.css'

// 首屏前应用主题，避免闪烁（与 index.html 的内联脚本一致）
applyTheme(getInitialTheme())

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
