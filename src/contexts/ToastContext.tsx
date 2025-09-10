import { createContext } from 'react'
import { ToastType } from '../components/ui/Toast'

export interface ToastData {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

export interface ToastContextType {
  addToast: (toast: Omit<ToastData, 'id'>) => void
  removeToast: (id: string) => void
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined)