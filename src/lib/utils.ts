import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items))
}

export function groupBy<T, K extends string>(
  items: T[],
  keyFn: (item: T) => K,
): Record<K, T[]> {
  return items.reduce(
    (acc, item) => {
      const key = keyFn(item)
      acc[key] = acc[key] ?? []
      acc[key].push(item)
      return acc
    },
    {} as Record<K, T[]>,
  )
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function isImageFile(type: string): boolean {
  return type.startsWith('image/')
}

export function isPdfFile(type: string, name?: string): boolean {
  return type === 'application/pdf' || Boolean(name?.toLowerCase().endsWith('.pdf'))
}

export const RECEIPT_MAX_BYTES = 8 * 1024 * 1024
export const RECEIPT_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf'
