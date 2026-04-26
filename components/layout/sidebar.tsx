'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users, Monitor, Laptop, Smartphone, Printer,
  Phone, Server, ScrollText, ClipboardList, ChevronLeft,
  PanelLeftOpen, LogOut, Sun, Moon, Menu, X, Users2
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/colaboradores', label: 'Colaboradores', icon: Users },
  { href: '/maquinas', label: 'Máquinas', icon: Monitor },
  { href: '/notebooks', label: 'Notebooks', icon: Laptop },
  { href: '/aparelhos', label: 'Aparelhos', icon: Smartphone },
  { href: '/impressoras', label: 'Impressoras', icon: Printer },
  { href: '/ramais', label: 'Ramais', icon: Phone },
  { href: '/racks', label: 'Racks', icon: Server },
  { href: '/movimentacoes', label: 'Auditoria', icon: ScrollText },
  { href: '/solicitacoes', label: 'Solicitações', icon: ClipboardList, badge: true },
  { href: '/usuarios', label: 'Usuários', icon: Users2, adminOnly: true },
]

interface SidebarProps {
  solicitacoesAbertas?: number
}

export function Sidebar({ solicitacoesAbertas = 0 }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const navItemsFiltrados = navItems.filter(item => 
    !('adminOnly' in item) || (session?.user as any)?.perfil === 'admin'
  )

  useEffect(() => setMounted(true), [])
  // close mobile drawer on route change
  useEffect(() => setMobileOpen(false), [pathname])

  const initials = session?.user?.name
    ? session.user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U'

  const NavContent = () => (
    <>
      {/* Logo header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-slate-700/50 shrink-0">
        <div className={cn('flex items-center gap-2.5 min-w-0', collapsed && 'justify-center w-full')}>
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <Server className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-none">IEC Inventário</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Gestão de TI</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="hidden lg:flex p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition shrink-0"
            title="Recolher menu"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {navItemsFiltrados.map(({ href, label, icon: Icon, badge }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all relative',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/60',
                collapsed && 'justify-center px-2'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
              {badge && solicitacoesAbertas > 0 && !collapsed && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none min-w-[18px] text-center">
                  {solicitacoesAbertas > 99 ? '99+' : solicitacoesAbertas}
                </span>
              )}
              {badge && solicitacoesAbertas > 0 && collapsed && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-700/50 p-2 space-y-1 shrink-0">
        {/* Theme toggle */}
        {mounted && (
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700/60 transition',
              collapsed && 'justify-center px-2'
            )}
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          >
            {theme === 'dark'
              ? <Sun  className="w-4 h-4 shrink-0" />
              : <Moon className="w-4 h-4 shrink-0" />
            }
            {!collapsed && (
              <span className="text-sm">{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>
            )}
          </button>
        )}

        {/* User */}
        <div className={cn('flex items-center gap-2 px-2 py-1.5', collapsed && 'justify-center')}>
          <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center text-[10px] font-bold text-blue-200 shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{session?.user?.name || 'Usuário'}</p>
                <p className="text-[10px] text-slate-400 truncate">{session?.user?.email || ''}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                title="Sair"
                className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-700 transition shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="flex items-center justify-center w-full p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition"
            title="Expandir menu"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Server className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">IEC Inventário</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'lg:hidden fixed top-0 left-0 bottom-0 z-50 w-64 bg-slate-900 flex flex-col transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-3 py-3 border-b border-slate-700/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Server className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">IEC Inventário</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon, badge }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link key={href} href={href}
                className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all relative',
                  active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                )}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{label}</span>
                {badge && solicitacoesAbertas > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                    {solicitacoesAbertas > 99 ? '99+' : solicitacoesAbertas}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-slate-700/50 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center text-[10px] font-bold text-blue-200 shrink-0">{initials}</div>
              <p className="text-xs font-medium text-white truncate">{session?.user?.name || 'Usuário'}</p>
            </div>
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col h-screen bg-slate-900 text-white transition-all duration-300 shrink-0',
          collapsed ? 'w-14' : 'w-56'
        )}
      >
        <NavContent />
      </aside>
    </>
  )
}
