'use client'

import { useState, useCallback, useEffect } from 'react'

interface Toast {
  id: number
  message: string
  type: 'default' | 'success' | 'error'
}

let toastId = 0
let addToastFn: ((message: string, type?: Toast['type']) => void) | null = null

export function showToast(message: string, type: Toast['type'] = 'default') {
  addToastFn?.(message, type)
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: Toast['type'] = 'default') => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3500)
  }, [])

  useEffect(() => {
    addToastFn = addToast
    return () => { addToastFn = null }
  }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div className="gc-toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`gc-toast ${toast.type !== 'default' ? toast.type : ''}`}>
          {toast.message}
        </div>
      ))}
    </div>
  )
}
