import {
  Baby,
  Banknote,
  Briefcase,
  Building2,
  Car,
  CircleEllipsis,
  Clapperboard,
  Coffee,
  CreditCard,
  Dumbbell,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  Laptop,
  Music,
  PawPrint,
  PiggyBank,
  Plane,
  Receipt,
  Shield,
  Shirt,
  ShoppingBag,
  Smartphone,
  Target,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const iconMap: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Receipt,
  Clapperboard,
  HeartPulse,
  GraduationCap,
  Plane,
  House,
  CircleEllipsis,
  Briefcase,
  Laptop,
  Building2,
  TrendingUp,
  Gift,
  Coffee,
  Fuel,
  Smartphone,
  Shirt,
  Dumbbell,
  PawPrint,
  Baby,
  Music,
  Gamepad2,
  Wallet,
  Landmark,
  CreditCard,
  PiggyBank,
  Banknote,
  Target,
  Shield,
}

export function CategoryIcon({
  name,
  color,
  className,
  size = 'md',
}: {
  name: string
  color?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const Icon = iconMap[name] ?? CircleEllipsis
  const box = size === 'sm' ? 'size-8' : size === 'lg' ? 'size-12' : 'size-10'
  const glyph = size === 'sm' ? 'size-3.5' : size === 'lg' ? 'size-5' : 'size-4'
  return (
    <span
      className={cn('inline-flex items-center justify-center rounded-full', box, className)}
      style={{ backgroundColor: `${color ?? '#8B5CF6'}22`, color: color ?? '#8B5CF6' }}
    >
      <Icon className={glyph} />
    </span>
  )
}
