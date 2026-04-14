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
    <nav className="fixed bottom-0 left-0 right-0 z-50 nav-safe"
      style={{ background: 'rgba(8,8,8,0.92)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(201,151,58,0.1)' }}>
      <div className="flex items-center justify-around px-2 pt-2 pb-1 max-w-lg mx-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} className="nav-item">
              <div className="relative">
                {active && (
                  <div className="absolute inset-0 rounded-full blur-md opacity-40"
                    style={{ background: 'var(--gold)', transform: 'scale(1.5)' }} />
                )}
                <Icon size={22} strokeWidth={active ? 2 : 1.5}
                  style={{ color: active ? 'var(--gold)' : 'rgba(240,235,224,0.3)', position: 'relative' }} />
              </div>
              <span className="text-[10px] font-medium tracking-wide"
                style={{ color: active ? 'var(--gold)' : 'rgba(240,235,224,0.3)' }}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
