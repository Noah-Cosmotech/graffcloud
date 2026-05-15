'use client'

import { useEffect } from 'react'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  actions?: React.ReactNode
}

export function Drawer({ open, onClose, title, subtitle, children, actions }: DrawerProps) {
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div className="gc-drawer-overlay" onClick={onClose} />
      <aside className="gc-drawer">
        <div className="gc-drawer-head">
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '-0.01em' }}>{title}</div>
            {subtitle && <div style={{ fontSize: 13, color: 'var(--ink-4)', marginTop: 4 }}>{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 22, color: 'var(--ink-4)', lineHeight: 1, padding: '4px 8px' }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="gc-drawer-body">{children}</div>
        {actions && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--line)', display: 'flex', gap: 10 }}>
            {actions}
          </div>
        )}
      </aside>
    </>
  )
}
