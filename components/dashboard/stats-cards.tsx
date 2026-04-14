'use client'

import Link from 'next/link'
import { Users, Monitor, Laptop, Smartphone, Printer, Phone, Server, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCard {
  label: string
  value: number
  icon: React.ElementType
  href: string
  iconColor: string
  iconBg: string
  accent: string
}

export function StatsCards({ stats }: {
  stats: {
    colaboradores: number
    maquinas: number
    notebooks: number
    aparelhos: number
    impressoras: number
    ramais: number
    racks: number
    solicitacoesAbertas: number
  }
}) {
  const cards: StatCard[] = [
    { label: 'Colaboradores Ativos', value: stats.colaboradores, icon: Users, href: '/colaboradores', iconColor: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-50 dark:bg-blue-950', accent: 'border-l-blue-500' },
    { label: 'Máquinas', value: stats.maquinas, icon: Monitor, href: '/maquinas', iconColor: 'text-violet-600 dark:text-violet-400', iconBg: 'bg-violet-50 dark:bg-violet-950', accent: 'border-l-violet-500' },
    { label: 'Notebooks', value: stats.notebooks, icon: Laptop, href: '/notebooks', iconColor: 'text-indigo-600 dark:text-indigo-400', iconBg: 'bg-indigo-50 dark:bg-indigo-950', accent: 'border-l-indigo-500' },
    { label: 'Aparelhos', value: stats.aparelhos, icon: Smartphone, href: '/aparelhos', iconColor: 'text-cyan-600 dark:text-cyan-400', iconBg: 'bg-cyan-50 dark:bg-cyan-950', accent: 'border-l-cyan-500' },
    { label: 'Impressoras', value: stats.impressoras, icon: Printer, href: '/impressoras', iconColor: 'text-teal-600 dark:text-teal-400', iconBg: 'bg-teal-50 dark:bg-teal-950', accent: 'border-l-teal-500' },
    { label: 'Ramais', value: stats.ramais, icon: Phone, href: '/ramais', iconColor: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-50 dark:bg-emerald-950', accent: 'border-l-emerald-500' },
    { label: 'Racks', value: stats.racks, icon: Server, href: '/racks', iconColor: 'text-amber-600 dark:text-amber-400', iconBg: 'bg-amber-50 dark:bg-amber-950', accent: 'border-l-amber-500' },
    { label: 'Solicitações Abertas', value: stats.solicitacoesAbertas, icon: ClipboardList, href: '/solicitacoes', iconColor: 'text-red-600 dark:text-red-400', iconBg: 'bg-red-50 dark:bg-red-950', accent: 'border-l-red-500' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
      {cards.map((card) => (
        <Link
          key={card.label}
          href={card.href}
          className={cn(
            'group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 border-l-2 rounded-xl p-4',
            'hover:shadow-sm hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-150',
            card.accent
          )}
        >
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-3', card.iconBg)}>
            <card.icon className={cn('w-4 h-4', card.iconColor)} />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums leading-none mb-1">
            {card.value.toLocaleString('pt-BR')}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{card.label}</p>
        </Link>
      ))}
    </div>
  )
}
