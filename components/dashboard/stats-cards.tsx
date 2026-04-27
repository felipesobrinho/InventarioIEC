'use client'

import Link from 'next/link'
import {
  Users, Monitor, Laptop, Smartphone,
  Printer, Phone, Server, ClipboardList,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Stats {
  colaboradores: number
  maquinas: number
  notebooks: number
  aparelhos: number
  impressoras: number
  ramais: number
  racks: number
  solicitacoesAbertas: number
  maquinasAlocadas: number
  notebooksAlocados: number
  aparelhosAlocados: number
  ramaisAlocados: number
}

interface CardConfig {
  label: string
  value: number
  icon: React.ElementType
  href: string
  iconColor: string
  iconBg: string
  accentColor: string        // cor da borda e do progress bar
  alocados?: number          // quantos estão alocados
  showProgress?: boolean
}

// Calcula a porcentagem e retorna a cor do progress bar
function getProgressColor(pct: number): string {
  if (pct >= 90) return 'bg-red-500'
  if (pct >= 70) return 'bg-amber-500'
  return 'bg-green-500'
}

function ProgressBar({ total, alocados, accentColor }: {
  total: number
  alocados: number
  accentColor: string
}) {
  const livres = Math.max(0, total - alocados)
  const pctAlocado = total > 0 ? Math.round((alocados / total) * 100) : 0
  const barColor = getProgressColor(pctAlocado)

  return (
    <div className="mt-3 space-y-1.5">
      {/* Barra */}
      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${pctAlocado}%` }}
        />
      </div>
      {/* Legenda */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
        <span>{alocados} alocado{alocados !== 1 ? 's' : ''}</span>
        <span>{livres} livre{livres !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}

export function StatsCards({ stats }: { stats: Stats }) {
  const cards: CardConfig[] = [
    {
      label: 'Colaboradores Ativos',
      value: stats.colaboradores,
      icon: Users,
      href: '/colaboradores',
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-50 dark:bg-blue-950',
      accentColor: 'border-l-blue-500',
      showProgress: false,
    },
    {
      label: 'Máquinas',
      value: stats.maquinas,
      icon: Monitor,
      href: '/maquinas',
      iconColor: 'text-violet-600 dark:text-violet-400',
      iconBg: 'bg-violet-50 dark:bg-violet-950',
      accentColor: 'border-l-violet-500',
      alocados: stats.maquinasAlocadas,
      showProgress: true,
    },
    {
      label: 'Notebooks',
      value: stats.notebooks,
      icon: Laptop,
      href: '/notebooks',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-50 dark:bg-indigo-950',
      accentColor: 'border-l-indigo-500',
      alocados: stats.notebooksAlocados,
      showProgress: true,
    },
    {
      label: 'Aparelhos',
      value: stats.aparelhos,
      icon: Smartphone,
      href: '/aparelhos',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      iconBg: 'bg-cyan-50 dark:bg-cyan-950',
      accentColor: 'border-l-cyan-500',
      alocados: stats.aparelhosAlocados,
      showProgress: true,
    },
    {
      label: 'Impressoras',
      value: stats.impressoras,
      icon: Printer,
      href: '/impressoras',
      iconColor: 'text-teal-600 dark:text-teal-400',
      iconBg: 'bg-teal-50 dark:bg-teal-950',
      accentColor: 'border-l-teal-500',
      showProgress: false,
    },
    {
      label: 'Ramais',
      value: stats.ramais,
      icon: Phone,
      href: '/ramais',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950',
      accentColor: 'border-l-emerald-500',
      alocados: stats.ramaisAlocados,
      showProgress: true,
    },
    {
      label: 'Racks',
      value: stats.racks,
      icon: Server,
      href: '/racks',
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-50 dark:bg-amber-950',
      accentColor: 'border-l-amber-500',
      showProgress: false,
    },
    {
      label: 'Solicitações Abertas',
      value: stats.solicitacoesAbertas,
      icon: ClipboardList,
      href: '/solicitacoes',
      iconColor: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-50 dark:bg-red-950',
      accentColor: 'border-l-red-500',
      showProgress: false,
    },
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
            card.accentColor,
            // Cards com progress bar têm altura um pouco maior — manter alinhamento
            card.showProgress ? 'flex flex-col justify-between' : ''
          )}
        >
          <div>
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-3', card.iconBg)}>
              <card.icon className={cn('w-4 h-4', card.iconColor)} />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums leading-none mb-1">
              {card.value.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{card.label}</p>
          </div>

          {card.showProgress && card.alocados !== undefined && card.value > 0 && (
            <ProgressBar
              total={card.value}
              alocados={card.alocados}
              accentColor={card.accentColor}
            />
          )}
        </Link>
      ))}
    </div>
  )
}