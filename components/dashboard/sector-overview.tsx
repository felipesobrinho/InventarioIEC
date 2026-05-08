'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  ArrowUpRight,
  Layers3,
  Laptop,
  Loader2,
  MapPin,
  Monitor,
  Phone,
  Smartphone,
  Users,
  X,
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
  const [selectedSectorIds, setSelectedSectorIds] = useState<string[]>([])
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  const summary = useMemo(() => {
    const totalSectors = setores.length
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

    return { totalSectors, sectorItems, totals }
  }, [setores])

  const selectedSectors = selectedSectorIds
    .map(id => setores.find(row => row.id === id))
    .filter((row): row is SectorOverviewRow => Boolean(row))
  const hasSectorSelection = selectedSectors.length > 0
  const displayedSectors = [
    ...summary.sectorItems.filter(row => selectedSectorIds.includes(row.id)),
    ...summary.sectorItems.filter(row => !selectedSectorIds.includes(row.id)),
  ]
  const pieSectors = hasSectorSelection
    ? summary.sectorItems.filter(row => selectedSectorIds.includes(row.id))
    : summary.sectorItems

  const countRows = hasSectorSelection ? selectedSectors : setores
  const kpiSeries = hasSectorSelection ? aggregateKpiSeries(selectedSectors) : aggregateKpiSeries(setores)
  const selectedSectorParam = selectedSectorIds.join(',')

  const categories = [
    { label: 'Aparelhos', href: '/aparelhos', value: countRows.reduce((sum, row) => sum + row.counts.aparelhos, 0), total: summary.totals.aparelhos, icon: Smartphone, color: 'bg-cyan-500' },
    { label: 'Máquinas', href: '/maquinas', value: countRows.reduce((sum, row) => sum + row.counts.maquinas, 0), total: summary.totals.maquinas, icon: Monitor, color: 'bg-violet-500' },
    { label: 'Ramais', href: '/ramais', value: countRows.reduce((sum, row) => sum + row.counts.ramais, 0), total: summary.totals.ramais, icon: Phone, color: 'bg-emerald-500' },
    { label: 'Notebooks', href: '/notebooks', value: countRows.reduce((sum, row) => sum + row.counts.notebooks, 0), total: summary.totals.notebooks, icon: Laptop, color: 'bg-indigo-500' },
    { label: 'Colaboradores', href: '/colaboradores', value: countRows.reduce((sum, row) => sum + row.counts.colaboradores, 0), total: summary.totals.colaboradores, icon: Users, color: 'bg-blue-500' },
  ]

  function toggleSectorSelection(sector: SectorOverviewRow) {
    setSelectedSectorIds(currentIds => {
      const nextIds = currentIds.includes(sector.id)
        ? currentIds.filter(id => id !== sector.id)
        : [...currentIds, sector.id]

      notifyFocusChange(nextIds, setores)
      return nextIds
    })
  }

  function clearSelection() {
    setSelectedSectorIds([])
    notifyFocusChange([], setores)
  }

  function buildCategoryHref(href: string) {
    if (!selectedSectorParam) return href
    const params = new URLSearchParams({ setor_id: selectedSectorParam })
    return `${href}?${params.toString()}`
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

      <div className="space-y-3">
        <SelectionStack
          sectors={selectedSectors}
          totalSectors={summary.totalSectors}
          onRemove={toggleSectorSelection}
          onClear={clearSelection}
        />
        <KpiChart
          title={hasSectorSelection ? 'Disponibilidade da seleção' : 'Evolução da disponibilidade'}
          subtitle={hasSectorSelection ? selectedSectors.map(sector => sector.nome).join(' + ') : 'Todos os setores do inventário'}
          points={kpiSeries}
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="flex flex-col rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
          <SectionTitle icon={<MapPin className="h-3.5 w-3.5" />} label="Distribuição" />
          <div className="mt-4 flex flex-1 items-center justify-center">
            <div
              className="relative h-44 w-44 rounded-full"
              style={{ background: buildPieGradient(pieSectors) }}
              aria-label="Distribuição de itens por setor"
            >
              <span className="absolute inset-8 flex flex-col items-center justify-center rounded-full bg-white text-center dark:bg-slate-900">
                <span className="text-xl font-bold text-slate-900 dark:text-white">{pieSectors.length}</span>
                <span className="text-[10px] font-semibold uppercase text-slate-400">
                  {hasSectorSelection ? 'selecionados' : 'setores'}
                </span>
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
                  onClick={() => toggleSectorSelection(sector)}
                  className={cn(
                    'w-full rounded-md bg-white px-3 py-2 text-left transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:hover:bg-blue-950/20',
                    selectedSectorIds.includes(sector.id) && 'ring-2 ring-blue-500'
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
          <SectionTitle icon={<Activity className="h-3.5 w-3.5" />} label={hasSectorSelection ? 'Resumo da seleção' : 'Resumo geral'} />
          {hasSectorSelection && (
            <button
              type="button"
              onClick={clearSelection}
              className="text-[11px] font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400"
            >
              Limpar seleção
            </button>
          )}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {categories.map(category => {
          const Icon = category.icon
          const share = pct(category.value, category.total)
          const href = buildCategoryHref(category.href)
          const canRedirect = category.value > 0
          const pending = pendingHref === href
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
                  {pending
                    ? <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                    : canRedirect && <ArrowUpRight className="h-3 w-3 text-slate-400 transition group-hover:text-blue-500" />
                  }
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
              onClick={() => setPendingHref(href)}
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

function notifyFocusChange(selectedIds: string[], setores: SectorOverviewRow[]) {
  const selected = selectedIds
    .map(id => setores.find(row => row.id === id))
    .filter((row): row is SectorOverviewRow => Boolean(row))
  const color = selected[0] ? getSectorColor(selected[0].nome) : '#3b82f6'
  const title = selected.length === 0
    ? 'Overview em visão geral'
    : selected.length === 1
      ? `Overview focado em ${selected[0].nome}`
      : `${selected.length} setores na seleção`
  const detail = selected.length === 0
    ? 'Resumo, gráfico e atalhos usando todos os setores.'
    : 'Resumo, gráfico e atalhos filtrados pela pilha selecionada.'

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

function SelectionStack({
  sectors,
  totalSectors,
  onRemove,
  onClear,
}: {
  sectors: SectorOverviewRow[]
  totalSectors: number
  onRemove: (sector: SectorOverviewRow) => void
  onClear: () => void
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white">
            <Layers3 className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Pilha de seleção</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {sectors.length === 0
                ? `${totalSectors} setores disponíveis para análise`
                : `${sectors.length} setor${sectors.length === 1 ? '' : 'es'} selecionado${sectors.length === 1 ? '' : 's'} em ordem de clique`
              }
            </p>
          </div>
        </div>
        {sectors.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="self-start rounded-md px-2 py-1 text-[11px] font-medium text-blue-600 transition hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/30"
          >
            Limpar pilha
          </button>
        )}
      </div>
      {sectors.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {sectors.map((sector, index) => (
            <span
              key={sector.id}
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
            >
              <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                {index + 1}
              </span>
              <span className="truncate">{sector.nome}</span>
              <button
                type="button"
                onClick={() => onRemove(sector)}
                className="rounded-full p-0.5 text-blue-500 transition hover:bg-blue-100 hover:text-blue-800 dark:hover:bg-blue-900"
                aria-label={`Remover ${sector.nome} da pilha`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function KpiChart({
  title,
  subtitle,
  points,
}: {
  title: string
  subtitle: string
  points: Array<{ label: string; total: number; available: number; unavailable: number }>
}) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    point: { label: string; total: number; available: number; unavailable: number }
    index: number
  } | null>(null)
  const width = 760
  const height = 282
  const padding = { top: 34, right: 86, bottom: 62, left: 72 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const maxValue = Math.max(1, ...points.flatMap(point => [point.total, point.available, point.unavailable]))
  const step = points.length > 1 ? chartWidth / (points.length - 1) : chartWidth
  const latest = points[points.length - 1] ?? { total: 0, available: 0, unavailable: 0 }
  const availability = pct(latest.available, latest.total)

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
      <div className="mb-3 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <SectionTitle icon={<Activity className="h-3.5 w-3.5" />} label={title} />
          <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400" title={subtitle}>
            {subtitle}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <ChartStat label="Total" value={latest.total} className="text-blue-200" />
          <ChartStat label="Disponíveis" value={latest.available} className="text-emerald-300" />
          <ChartStat label="Ocupação" value={`${pct(latest.unavailable, latest.total)}%`} className="text-fuchsia-300" />
        </div>
      </div>
      <div className="mb-2 grid gap-2 md:grid-cols-[minmax(0,1fr)_180px]">
        <div className="rounded-md bg-white px-3 py-2 dark:bg-slate-900">
          <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-medium text-slate-400">
            <span>Disponibilidade atual</span>
            <span className="font-bold tabular-nums text-emerald-400">{availability}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="h-full rounded-full bg-emerald-400" style={{ width: `${availability}%` }} />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-[11px] text-slate-400 dark:bg-slate-900">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-200" />Total</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />Livres</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-fuchsia-500" />Ocupados</span>
        </div>
      </div>
      <div className="relative h-72 w-full overflow-hidden rounded-md bg-white dark:bg-slate-900">
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
          {[0, 0.25, 0.5, 0.75, 1].map(mark => {
            const yPos = padding.top + chartHeight * mark
            const label = Math.round(maxValue * (1 - mark))
            return (
              <g key={mark}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={yPos}
                  y2={yPos}
                  className="stroke-slate-200 dark:stroke-slate-800"
                  strokeDasharray={mark === 1 ? undefined : '3 8'}
                />
                <text x={padding.left - 14} y={yPos + 4} textAnchor="end" className="fill-slate-400 text-[10px]">
                  {label}
                </text>
              </g>
            )
          })}
          {points.map((point, index) => {
            const barWidth = Math.max(14, Math.min(30, step * 0.36))
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
                <text x={x(index)} y={Math.max(14, y(point.total) - 8)} textAnchor="middle" className="fill-blue-200 text-[10px] font-semibold">
                  {point.total > 0 ? point.total : ''}
                </text>
                <text x={x(index)} y={height - 22} textAnchor="middle" className="fill-slate-400 text-[12px]">
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

function ChartStat({
  label,
  value,
  className,
}: {
  label: string
  value: number | string
  className: string
}) {
  return (
    <div className="rounded-md bg-white px-3 py-2 text-right dark:bg-slate-900">
      <p className="text-[10px] font-semibold uppercase text-slate-400">{label}</p>
      <p className={cn('mt-0.5 text-lg font-bold tabular-nums', className)}>{value}</p>
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
