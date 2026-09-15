<template>
  <div ref="root" class="article-body" v-html="html"></div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js/lib/core'
// 按需注册常用语言，避免全量打包（全量约 1MB）
import python from 'highlight.js/lib/languages/python'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import yaml from 'highlight.js/lib/languages/yaml'
import java from 'highlight.js/lib/languages/java'
import cpp from 'highlight.js/lib/languages/cpp'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import sql from 'highlight.js/lib/languages/sql'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import markdown from 'highlight.js/lib/languages/markdown'
import plaintext from 'highlight.js/lib/languages/plaintext'
import DOMPurify from 'dompurify'

const HLJS_LANGS = { python, javascript, typescript, bash, shell: bash, json, yaml, yml: yaml, java, cpp, 'c++': cpp, go, rust, sql, xml, html: xml, css, dockerfile, markdown, md: markdown, plaintext, text: plaintext }
Object.entries(HLJS_LANGS).forEach(([name, lang]) => hljs.registerLanguage(name, lang))

const props = defineProps({
  markdown: { type: String, default: '' }
})

const emit = defineEmits(['rendered'])
const root = ref(null)

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight(str, lang) {
    const code = lang && hljs.getLanguage(lang)
      ? (() => { try { return hljs.highlight(str, { language: lang }).value } catch (e) { return md.utils.escapeHtml(str) } })()
      : md.utils.escapeHtml(str)
    const cls = lang ? ` language-${lang}` : ''
    return `<pre><code class="hljs${cls}">${code}</code></pre>`
  }
})

// 渲染后给标题加 id（供 TOC 锚点使用）
let headingSeq = 0
md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet('id', `h-${headingSeq++}`)
  return self.renderToken(tokens, idx, options)
}

const html = computed(() => {
  headingSeq = 0
  const rendered = md.render(props.markdown || '')
  return DOMPurify.sanitize(rendered, { ADD_ATTR: ['target', 'rel'] })
})

function enhance() {
  const el = root.value
  if (!el) return

  // 外链新窗口打开
  el.querySelectorAll('a[href^="http"]').forEach((a) => {
    a.setAttribute('target', '_blank')
    a.setAttribute('rel', 'noopener')
  })

  // 代码块复制按钮
  el.querySelectorAll('pre').forEach((pre) => {
    if (pre.querySelector('.copy-code-btn')) return
    const btn = document.createElement('button')
    btn.className = 'copy-code-btn'
    btn.textContent = 'copy'
    btn.addEventListener('click', () => {
      const code = pre.querySelector('code')
      if (!code) return
      navigator.clipboard.writeText(code.innerText).then(() => {
        btn.textContent = 'copied!'
        setTimeout(() => { btn.textContent = 'copy' }, 1500)
      })
    })
    pre.appendChild(btn)
  })

  // 向父组件上报标题列表（生成 TOC）
  const headings = Array.from(el.querySelectorAll('h2, h3')).map((h) => ({
    id: h.id,
    text: h.textContent,
    level: h.tagName.toLowerCase()
  }))
  emit('rendered', headings)
}

watch(html, () => nextTick(enhance), { immediate: true })
</script>
