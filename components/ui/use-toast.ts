"use client"

import * as React from 'react'

type ToastVariant = 'default' | 'destructive'

export type Toast = {
  id?: string
  title?: string
  description?: string
  variant?: ToastVariant
}

const listeners = new Set<(toast: Toast) => void>()

export function useToast() {
  const [, forceRerender] = React.useState(0)

  React.useEffect(() => {
    const listener = () => forceRerender((value) => value + 1)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return {
    toast: (toast: Toast) => {
      if (typeof window !== 'undefined') {
        const prefix = toast.title ?? (toast.variant === 'destructive' ? 'Error' : 'Info')
        const message = toast.description ? `${prefix}: ${toast.description}` : prefix
        console.log(message)
      }
      listeners.forEach((listener) => listener(toast))
    },
  }
}
