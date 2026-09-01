import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

export function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme()

  return (
    <Sonner
      theme={resolvedTheme === 'light' ? 'light' : 'dark'}
      position="top-right"
      closeButton
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:border-border group-[.toaster]:bg-card-elevated group-[.toaster]:text-foreground group-[.toaster]:shadow-card',
          title: 'group-[.toast]:text-foreground',
          description: 'group-[.toast]:text-muted-foreground',
          success: 'group-[.toast]:border-primary/25',
          error: 'group-[.toast]:border-destructive/30',
          warning: 'group-[.toast]:border-warning/30',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  )
}
