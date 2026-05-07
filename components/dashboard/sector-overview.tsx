'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Laptop,
  MapPin,
  Monitor,
  Phone,
  Smartphone,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export interface SectorOverviewRow {
  id: string
  nome: string
  descricao: string | null
  ativo: boolean
  created_at: string | null
  counts: {
    colaboradores: number
    maquinas: number
    notebooks: number
    aparelhos: number
    impressoras: number
    ramais: number
    racks: number
  }
  kpi: Array<{
    label: string
    total: number
    available: number
    unavailable: number
  }>
}

type SectorFilter =
  | { kind: 'all'; label: string }
  | { kind: 'active'; label: string }
  | { kind: 'sector'; label: string; setorId: string }

const chartColors = [
  '#3b82f6',
  '#8b5cf6',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#14b8a6',
  '#6366f1',
  '#ec4899',
  '#84cc16',
  '#f97316',
  '#22c55e',
  '#0ea5e9',
  '#a855f7',
  '#eab308',
  '#f43f5e',
]

function getSectorColor(seed: string) {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 9973
  }
  return chartColors[hash % chartColors.length]
}

function pct(value: number, total: number) {
  if (total <= 0) return 0
  return Math.round((value / total) * 100)
}

function buildPieGradient(items: Array<{ distribution: number; color: string }>) {
  let cursor = 0
  const stops = items.map((item) => {
    const start = cursor
    cursor += item.distribution
    return `${item.color} ${start}% ${cursor}%`
  })

  return stops.length > 0 ? `conic-gradient(${stops.join(', ')})` : 'conic-gradient(#334155 0% 100%)'
}

function aggregateKpiSeries(setores: SectorOverviewRow[]) {
  const firstSeries = setores[0]?.kpi ?? []
  return firstSeries.map((point, index) => ({
    label: point.label,
    total: setores.reduce((sum, setor) => sum + (setor.kpi[index]?.total ?? 0), 0),
    available: setores.reduce((sum, setor) => sum + (setor.kpi[index]?.available ?? 0), 0),
    unavailable: setores.reduce((sum, setor) => sum + (setor.kpi[index]?.unavailable ?? 0), 0),
  }))
}

export function SectorOverview({ setores }: { setores: SectorOverviewRow[] }) {
  const [activeFilter, setActiveFilter] = useState<SectorFilter | null>(null)

  const summary = useMemo(() => {
    const totalSectors = setores.length
    const active = setores.filter(row => row.ativo).length
    const totals = {
      aparelhos: setores.reduce((sum, row) => sum + row.counts.aparelhos, 0),
      maquinas: setores.reduce((sum, row) => sum + row.counts.maquinas, 0),
      ramais: setores.reduce((sum, row) => sum + row.counts.ramais, 0),
      notebooks: setores.reduce((sum, row) => sum + row.counts.notebooks, 0),
      colaboradores: setores.reduce((sum, row) => sum + row.counts.colaboradores, 0),
    }

    const sectorItems = [...setores]
      .map((row) => ({
        ...row,
        total: row.counts.colaboradores,
        color: getSectorColor(row.nome),
      }))
      .sort((a, b) => b.total - a.total)
      .map((row) => ({
        ...row,
        distribution: pct(row.counts.colaboradores, totals.colaboradores),
      }))

    return { totalSectors, active, sectorItems, totals }
  }, [setores])

  const selectedSector = activeFilter?.kind === 'sector'
    ? setores.find(row => row.id === activeFilter.setorId) ?? null
    : null
  const displayedSectors = activeFilter?.kind === 'active'
    ? summary.sectorItems.filter(row => row.ativo)
    : summary.sectorItems

  const countRows = selectedSector ? [selectedSector] : setores
  const kpiSeries = selectedSector ? selectedSector.kpi : aggregateKpiSeries(setores)

  const categories = [
    { label: 'Aparelhos', href: '/aparelhos', value: countRows.reduce((sum, row) => sum + row.counts.aparelhos, 0), total: summary.totals.aparelhos, icon: Smartphone, color: 'bg-cyan-500' },
    { label: 'Máquinas', href: '/maquinas', value: countRows.reduce((sum, row) => sum + row.counts.maquinas, 0), total: summary.totals.maquinas, icon: Monitor, color: 'bg-violet-500' },
    { label: 'Ramais', href: '/ramais', value: countRows.reduce((sum, row) => sum + row.counts.ramais, 0), total: summary.totals.ramais, icon: Phone, color: 'bg-emerald-500' },
    { label: 'Notebooks', href: '/notebooks', value: countRows.reduce((sum, row) => sum + row.counts.notebooks, 0), total: summary.totals.notebooks, icon: Laptop, color: 'bg-indigo-500' },
    { label: 'Colaboradores', href: '/colaboradores', value: countRows.reduce((sum, row) => sum + row.counts.colaboradores, 0), total: summary.totals.colaboradores, icon: Users, color: 'bg-blue-500' },
  ]

  function toggleFilter(filter: SectorFilter) {
    const sameSector = activeFilter?.kind === 'sector' && filter.kind === 'sector' && activeFilter.setorId === filter.setorId
    const sameKind = activeFilter?.kind === filter.kind && filter.kind !== 'sector'
    const nextFilter = sameSector || sameKind ? null : filter

    setActiveFilter(nextFilter)

    notifyFocusChange(nextFilter, setores)
  }

  return (
    <section className="mb-6 rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">Overview geral</p>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Setores</h2>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Activity className="h-4 w-4" />
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="grid grid-cols-2 gap-2">
          <Metric icon={<MapPin className="h-3.5 w-3.5" />} label="Cadastrados" value={summary.totalSectors} onClick={() => toggleFilter({ kind: 'all', label: 'Todos os setores' })} />
          <Metric icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Ativos" value={summary.active} tone="success" onClick={() => toggleFilter({ kind: 'active', label: 'Setores ativos' })} />
        </div>
        <KpiChart
          title={selectedSector ? `Disponibilidade de ${selectedSector.nome}` : 'Evolução da disponibilidade'}
          points={kpiSeries}
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="flex flex-col rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
          <SectionTitle icon={<MapPin className="h-3.5 w-3.5" />} label="Distribuição" />
          <div className="mt-4 flex flex-1 items-center justify-center">
            <div
              className="relative h-44 w-44 rounded-full"
              style={{ background: buildPieGradient(displayedSectors) }}
              aria-label="Distribuição de itens por setor"
            >
              <span className="absolute inset-8 flex flex-col items-center justify-center rounded-full bg-white text-center dark:bg-slate-900">
                <span className="text-xl font-bold text-slate-900 dark:text-white">{displayedSectors.length}</span>
                <span className="text-[10px] font-semibold uppercase text-slate-400">setores</span>
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
          <SectionTitle icon={<Users className="h-3.5 w-3.5" />} label="Colaboradores por setor" />
          {displayedSectors.length > 0 ? (
            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {displayedSectors.map(sector => (
                <button
                  key={sector.id}
                  type="button"
                  onClick={() => toggleFilter({ kind: 'sector', setorId: sector.id, label: sector.nome })}
                  className={cn(
                    'w-full rounded-md bg-white px-3 py-2 text-left transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:hover:bg-blue-950/20',
                    activeFilter?.kind === 'sector' && activeFilter.setorId === sector.id && 'ring-2 ring-blue-500'
                  )}
                >
                  <span className="mb-1 flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: sector.color }} />
                      <span className="truncate">{sector.nome}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-300">
                      <Users className="h-3 w-3" />
                      {sector.counts.colaboradores}
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-400">{sector.distribution}% dos colaboradores</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-400">Sem dados para compor setores.</p>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="mb-3 flex items-center justify-between gap-3">
          <SectionTitle icon={<Activity className="h-3.5 w-3.5" />} label={selectedSector ? `Resumo de ${selectedSector.nome}` : 'Resumo geral'} />
          {selectedSector && (
            <button
              type="button"
              onClick={() => setActiveFilter(null)}
              className="text-[11px] font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400"
            >
              Limpar setor
            </button>
          )}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {categories.map(category => {
          const Icon = category.icon
          const share = pct(category.value, category.total)
          const href = selectedSector ? `${category.href}?setor_id=${selectedSector.id}` : category.href
          const canRedirect = category.value > 0
          const cardClassName = cn(
            'group rounded-lg bg-white px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900',
            canRedirect
              ? 'hover:bg-blue-50 dark:hover:bg-blue-950/20'
              : 'cursor-not-allowed opacity-55'
          )
          const content = (
            <>
              <div className="mb-2 flex items-center justify-between gap-2 text-xs text-slate-400">
                <span className="flex items-center gap-2 font-semibold uppercase">
                  <span className={cn('flex h-5 w-5 items-center justify-center rounded-md text-white', category.color)}>
                    <Icon className="h-3 w-3" />
                  </span>
                  {category.label}
                </span>
                <span className="flex items-center gap-1 font-bold tabular-nums text-slate-700 dark:text-slate-200">
                  {category.value}
                  {canRedirect && <ArrowUpRight className="h-3 w-3 text-slate-400 transition group-hover:text-blue-500" />}
                </span>
              </div>
              <p className="mb-2 text-[11px] text-slate-400">
                {share}% do total de {category.label.toLowerCase()}
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div className={cn('h-full rounded-full', category.color)} style={{ width: `${share}%` }} />
              </div>
            </>
          )

          if (!canRedirect) {
            return (
              <div key={category.label} className={cardClassName} aria-disabled="true">
                {content}
              </div>
            )
          }

          return (
            <Link
              key={category.label}
              href={href}
              className={cardClassName}
            >
              {content}
            </Link>
          )
        })}
        </div>
      </div>
    </section>
  )
}

function notifyFocusChange(filter: SectorFilter | null, setores: SectorOverviewRow[]) {
  const sector = filter?.kind === 'sector'
    ? setores.find(row => row.id === filter.setorId)
    : null
  const color = sector
    ? getSectorColor(sector.nome)
    : filter?.kind === 'active'
      ? '#10b981'
      : '#3b82f6'
  const title = !filter
    ? 'Overview em visão geral'
    : filter.kind === 'sector'
      ? `Overview focado em ${filter.label}`
      : `Overview focado em ${filter.label.toLowerCase()}`
  const detail = sector
    ? 'Resumo, gráfico e atalhos filtrados por setor.'
    : 'Resumo, gráfico e atalhos usando o recorte selecionado.'

  toast.custom((id) => (
    <div className="flex w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950">
      <span className="w-1.5 shrink-0" style={{ backgroundColor: color }} />
      <div className="min-w-0 flex-1 px-3 py-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
          </div>
          <button
            type="button"
            onClick={() => toast.dismiss(id)}
            className="rounded-md px-1.5 text-sm text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Fechar notificação"
          >
            x
          </button>
        </div>
      </div>
    </div>
  ))
}

function Metric({
  icon,
  label,
  value,
  tone = 'default',
  onClick,
}: {
  icon: React.ReactNode
  label: string
  value: number
  tone?: 'default' | 'success' | 'warning'
  onClick: () => void
}) {
  const toneClassName = {
    default: 'text-slate-700 dark:text-slate-200',
    success: 'text-emerald-600 dark:text-emerald-300',
    warning: 'text-amber-600 dark:text-amber-300',
  }[tone]

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-blue-300 hover:bg-blue-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-blue-700 dark:hover:bg-blue-950/20"
    >
      <div className="mb-2 flex items-center gap-1.5 text-slate-400">
        {icon}
        <span className="text-[10px] font-semibold uppercase">{label}</span>
      </div>
      <p className={cn('text-lg font-bold tabular-nums', toneClassName)}>{value.toLocaleString('pt-BR')}</p>
    </button>
  )
}

function KpiChart({
  title,
  points,
}: {
  title: string
  points: Array<{ label: string; total: number; available: number; unavailable: number }>
}) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    point: { label: string; total: number; available: number; unavailable: number }
    index: number
  } | null>(null)
  const width = 760
  const height = 218
  const padding = { top: 28, right: 80, bottom: 54, left: 80 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const maxValue = Math.max(1, ...points.flatMap(point => [point.total, point.available, point.unavailable]))
  const step = points.length > 1 ? chartWidth / (points.length - 1) : chartWidth

  function x(index: number) {
    return padding.left + index * step
  }

  function y(value: number) {
    return padding.top + chartHeight - (value / maxValue) * chartHeight
  }

  function linePath(key: 'available' | 'unavailable') {
    return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(point[key])}`).join(' ')
  }

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <SectionTitle icon={<Activity className="h-3.5 w-3.5" />} label={title} />
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-200" />Total</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />Disponíveis</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-fuchsia-500" />Ocupados</span>
        </div>
      </div>
      <div className="relative h-60 w-full overflow-hidden">
        {hoveredPoint && (
          <div
            className="pointer-events-none absolute z-10 min-w-44 -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-950/95 px-3 py-2 text-xs text-slate-100 shadow-xl"
            style={{
              left: `${(x(hoveredPoint.index) / width) * 100}%`,
              top: '12px',
            }}
          >
            <p className="mb-1 font-semibold text-white">{hoveredPoint.point.label}</p>
            <div className="space-y-0.5 text-slate-300">
              <p>Total: <span className="font-semibold text-blue-200">{hoveredPoint.point.total}</span></p>
              <p>Disponíveis: <span className="font-semibold text-emerald-300">{hoveredPoint.point.available}</span></p>
              <p>Ocupados: <span className="font-semibold text-fuchsia-300">{hoveredPoint.point.unavailable}</span></p>
            </div>
          </div>
        )}
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" role="img" aria-label={title} preserveAspectRatio="none">
          {[0.25, 0.5, 0.75].map(mark => (
            <line
              key={mark}
              x1={padding.left}
              x2={width - padding.right}
              y1={padding.top + chartHeight * mark}
              y2={padding.top + chartHeight * mark}
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeDasharray="3 8"
            />
          ))}
          {points.map((point, index) => {
            const barWidth = Math.max(10, Math.min(24, step * 0.36))
            return (
              <g key={`${point.label}-${index}`}>
                <rect
                  x={x(index) - barWidth / 2}
                  y={y(point.total)}
                  width={barWidth}
                  height={padding.top + chartHeight - y(point.total)}
                  rx="4"
                  className="fill-blue-300/80 transition dark:fill-blue-400/30"
                  onMouseEnter={() => setHoveredPoint({ point, index })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                <text x={x(index)} y={height - 16} textAnchor="middle" className="fill-slate-400 text-[12px]">
                  {point.label}
                </text>
              </g>
            )
          })}
          <path d={linePath('available')} fill="none" stroke="#34d399" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          <path d={linePath('unavailable')} fill="none" stroke="#c026d3" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {points.map((point, index) => (
            <g key={`dots-${point.label}-${index}`}>
              <circle
                cx={x(index)}
                cy={y(point.available)}
                r="6"
                fill="#34d399"
                stroke="#0f172a"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
                onMouseEnter={() => setHoveredPoint({ point, index })}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              <circle
                cx={x(index)}
                cy={y(point.unavailable)}
                r="6"
                fill="#c026d3"
                stroke="#0f172a"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
                onMouseEnter={() => setHoveredPoint({ point, index })}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">
      {icon}
      <span>{label}</span>
    </div>
  )
}
