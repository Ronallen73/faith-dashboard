'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CheckSquare, Package, TrendingUp, Receipt } from 'lucide-react'

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Home' },
  { href: '/approval', icon: CheckSquare, label: 'Approve' },
  { href: '/products', icon: Package, label: 'Products' },
  { href: '/trends', icon: TrendingUp, label: 'Trends' },
  { href: '/tax', icon: Receipt, label: 'Tax' },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-surface-3 nav-safe"
      style={{ background: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(20px)' }}>
      <div className="flex items-center justify-around px-2 pt-2 pb-1 max-w-lg mx-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200"
              style={{ color: active ? 'var(--gold)' : 'rgba(240,235,224,0.35)' }}>
              <Icon size={20} strokeWidth={active ? 2 : 1.5} />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
