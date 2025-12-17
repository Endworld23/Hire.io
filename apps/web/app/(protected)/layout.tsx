'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Bell,
  Briefcase,
  FileText,
  LayoutDashboard,
  Menu,
  Settings,
  UserRound,
  Users,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Jobs', href: '/dashboard/jobs', icon: Briefcase },
  { label: 'Candidates', href: '#', icon: Users, disabled: true },
  { label: 'Applications', href: '#', icon: FileText, disabled: true },
]

type ProtectedLayoutProps = {
  children: React.ReactNode
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const sidebarWidth = useMemo(() => (isSidebarOpen ? 'lg:w-64' : 'lg:w-20'), [isSidebarOpen])

  const isActive = (href: string) => {
    if (href === '#') return false
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex flex-col border-r bg-white shadow-sm transition-all',
          isSidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full w-64 lg:translate-x-0',
          sidebarWidth
        )}
      >
        <div className="flex h-16 items-center px-4 border-b">
          <span className="text-lg font-semibold text-slate-900">
            {isSidebarOpen ? 'Hire.io' : 'H'}
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-disabled={item.disabled}
                className={cn(
                  'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  item.disabled
                    ? 'cursor-not-allowed text-slate-400'
                    : active
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
                onClick={(event) => {
                  if (item.disabled) {
                    event.preventDefault()
                  }
                  setIsSidebarOpen(false)
                }}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className={cn('truncate', !isSidebarOpen && 'hidden lg:inline')}>
                  {item.label}
                </span>
                {item.disabled && (
                  <span className="ml-auto text-xs text-slate-400">
                    {isSidebarOpen ? 'Soon' : ''}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div
        className={cn(
          'flex min-h-screen flex-1 flex-col transition-all',
          isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        )}
      >
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle navigation"
              onClick={() => setIsSidebarOpen((open) => !open)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-slate-900">Navigation</p>
              <p className="text-xs text-slate-500">Jump between workspaces</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Settings">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="sm" aria-label="Account">
              <UserRound className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </Button>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>

      <div
        className={cn(
          'fixed inset-0 z-20 bg-black/30 transition-opacity lg:hidden',
          isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />
    </div>
  )
}
