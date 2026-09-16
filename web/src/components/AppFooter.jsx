import { useEffect, useState } from 'react'
import { loadSite } from '../store'
import { formatDate } from '../api/client'

export default function AppFooter() {
  const [site, setSite] = useState(null)

  useEffect(() => { loadSite().then(setSite).catch(() => {}) }, [])

  const generated = site && site.generatedAt ? formatDate(site.generatedAt) : ''

  return (
    <footer className="app-footer">
      <span>© {new Date().getFullYear()} {(site && site.owner && site.owner.displayName) || 'cjy'} · React 19 + Ant Design 6 · GitHub Pages</span>
      {generated && <span className="footer-sub">content updated: {generated}</span>}
    </footer>
  )
}
