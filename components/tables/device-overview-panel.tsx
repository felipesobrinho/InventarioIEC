'use client'

import type { ReactNode } from 'react'
import { Activity, CalendarClock, CheckCircle2, Layers3, MapPin, Users } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import type { AlocacaoAtiva } from '@/types'

export interface DeviceOverviewItem {
  id: string
  setor?: string | null
  nome_setor?: string | null
  created_at?: string | null
  data_revisao?: string | null
  ultima_revisao?: string | null
  alocacao_ativa?: AlocacaoAtiva | null
  alocacoes_ativas?: AlocacaoAtiva[]
}

interface DeviceOverviewPanelProps<T extends DeviceOverviewItem> {
  title: string
  total: number
  items: T[]
  selected: T | null
  accentClassName: string
  getTitle: (item: T) => string
  getSubtitle: (item: T) => string
  getMeta?: (item: T) => ReactNode
}

const chartColors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

function getSetor(item: DeviceOverviewItem) {
  return item.setor || item.nome_setor || item.alocacao_ativa?.colaborador.setor || 'Sem setor'
}

function getRevisionDate(item: DeviceOverviewItem) {
  return item.data_revisao || item.ultima_revisao || item.created_at || null
}

function isAllocated(item: DeviceOverviewItem) {
  return (item.alocacoes_ativas?.length ?? 0) > 0 || Boolean(item.alocacao_ativa)
}

function pct(value: number, total: number) {
  if (total <= 0) return 0
  return Math.round((value / total) * 100)
}

function buildPieGradient(sectors: Array<{ distribution: number; color: string }>) {
  let cursor = 0
  const stops = sectors.map((sector) => {
    const start = cursor
    cursor += sector.distribution
    return `${sector.color} ${start}% ${cursor}%`
  })

  return stops.length > 0 ? `conic-gradient(${stops.join(', ')})` : 'conic-gradient(#cbd5e1 0% 100%)'
}

export function DeviceOverviewPanel<T extends DeviceOverviewItem>({
  title,
  total,
  items,
  selected,
  accentClassName,
  getTitle,
  getSubtitle,
  getMeta,
}: DeviceOverviewPanelProps<T>) {
  const analyzedTotal = items.length
  const allocated = items.filter(isAllocated).length
  const free = Math.max(0, analyzedTotal - allocated)
  const occupancy = pct(allocated, analyzedTotal)

  const sectors = Array.from(
    items.reduce((map, item) => {
      const setor = getSetor(item)
      const current = map.get(setor) ?? { total: 0, allocated: 0 }
      current.total += 1
      if (isAllocated(item)) current.allocated += 1
      map.set(setor, current)
      return map
    }, new Map<string, { total: number; allocated: number }>())
  )
    .map(([setor, value], index) => ({
      setor,
      ...value,
      distribution: pct(value.total, analyzedTotal),
      occupancy: pct(value.allocated, value.total),
      color: chartColors[index % chartColors.length],
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)

  const latestRevision = items
    .map(getRevisionDate)
    .filter(Boolean)
    .sort((a, b) => new Date(String(b)).getTime() - new Date(String(a)).getTime())[0]

  const selectedAllocations = selected?.alocacoes_ativas ?? (selected?.alocacao_ativa ? [selected.alocacao_ativa] : [])

  return (
    <section className="mb-5 rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Overview geral</p>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
        </div>
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg text-white', accentClassName)}>
          <Activity className="h-4 w-4" />
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Metric icon={<Layers3 className="h-3.5 w-3.5" />} label="Cadastrados" value={total.toLocaleString('pt-BR')} />
            <Metric icon={<Activity className="h-3.5 w-3.5" />} label="Contexto geral" value={analyzedTotal.toLocaleString('pt-BR')} />
            <Metric icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Livres" value={free.toLocaleString('pt-BR')} tone="success" />
            <Metric icon={<Users className="h-3.5 w-3.5" />} label="Ocupação" value={`${occupancy}%`} tone={occupancy >= 90 ? 'danger' : occupancy >= 50 ? 'warning' : 'success'} />
          </div>

          <div className="grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
              <SectionTitle icon={<MapPin className="h-3.5 w-3.5" />} label="Setores" />
              <div className="mt-4 flex items-center justify-center">
                <div
                  className="relative h-40 w-40 rounded-full"
                  style={{ background: buildPieGradient(sectors) }}
                  aria-label="Distribuição de dispositivos por setor"
                >
                  <div className="absolute inset-8 flex flex-col items-center justify-center rounded-full bg-white text-center dark:bg-slate-900">
                    <span className="text-xl font-bold text-slate-900 dark:text-white">{sectors.length}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">setores</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
              <SectionTitle icon={<MapPin className="h-3.5 w-3.5" />} label="Ocupação por setor" />
              {sectors.length > 0 ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {sectors.map(sector => (
                    <div key={sector.setor} className="rounded-md bg-white px-3 py-2 dark:bg-slate-900">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: sector.color }} />
                          <span className="truncate">{sector.setor}</span>
                        </span>
                        <span className="text-xs font-semibold text-slate-400">{sector.occupancy}%</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {sector.allocated}/{sector.total} alocados · {sector.distribution}% do parque
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-slate-400">Sem dados para compor setores.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
            <SectionTitle icon={<CalendarClock className="h-3.5 w-3.5" />} label="Última revisão geral" />
            <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {latestRevision ? formatDate(String(latestRevision)) : 'Sem revisão registrada'}
            </p>
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3 dark:border-blue-900/60 dark:bg-blue-950/20">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-500 dark:text-blue-300">
              {selected ? 'Em inspeção' : 'Nenhum item selecionado'}
            </p>
            {selected ? (
              <div className="mt-2 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{getTitle(selected)}</h3>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{getSubtitle(selected)}</p>
                  {getMeta?.(selected)}
                </div>
                <div className="space-y-1.5">
                  {selectedAllocations.length > 0 ? selectedAllocations.map((allocation, index) => (
                    <div key={allocation.id ?? index} className="rounded-md bg-white px-2.5 py-2 text-xs dark:bg-slate-900">
                      <p className="font-medium text-slate-800 dark:text-slate-100">{allocation.colaborador.nome}</p>
                      <p className="text-slate-400">{allocation.colaborador.setor || 'Sem setor vinculado'}</p>
                    </div>
                  )) : (
                    <p className="rounded-md bg-white px-2.5 py-2 text-xs text-slate-400 dark:bg-slate-900">
                      Dispositivo livre para alocação.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Selecione um registro na tabela para acompanhar aqui os dados do item durante a inspeção.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function SectionTitle({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
      {icon}
      <span>{label}</span>
    </div>
  )
}

function Metric({
  icon,
  label,
  value,
  tone = 'default',
}: {
  icon: ReactNode
  label: string
  value: string
  tone?: 'default' | 'success' | 'warning' | 'danger'
}) {
  const toneClassName = {
    default: 'text-slate-700 dark:text-slate-200',
    success: 'text-emerald-600 dark:text-emerald-300',
    warning: 'text-amber-600 dark:text-amber-300',
    danger: 'text-red-600 dark:text-red-300',
  }[tone]

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="mb-2 flex items-center gap-1.5 text-slate-400">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className={cn('text-lg font-bold tabular-nums', toneClassName)}>{value}</p>
    </div>
  )
}
