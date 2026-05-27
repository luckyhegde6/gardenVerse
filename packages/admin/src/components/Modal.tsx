'use client'

import { useEffect, type ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function Modal({ open, onOpenChange, title, description, children, className }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    if (open) document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onOpenChange])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out z-40" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            'w-full max-w-lg rounded-xl border border-slate-700/60 bg-slate-900 p-6 shadow-2xl',
            'focus:outline-none',
            className
          )}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-slate-100">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-sm text-slate-400 mt-1">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close className="rounded-lg p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function ModalFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800', className)}>
      {children}
    </div>
  )
}
