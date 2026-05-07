'use client'

import type { CSSProperties, ReactNode } from 'react'
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Layers3,
  MapPin,
  ShieldAlert,
  Users,
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import type { AlocacaoAtiva } from '@/types'
import { ACAO_LABELS, type AuditLog } from '@/lib/audit-constants'
import { toast } from 'sonner'

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

export interface OverviewFilter {
  kind: string
  value?: string
  label?: string
  color?: string
  tone?: 'default' | 'success' | 'warning' | 'danger'
}

interface OverviewMetric {
  label: string
  value: string
  icon: ReactNode
  tone?: 'default' | 'success' | 'warning' | 'danger'
  filter?: OverviewFilter
}

interface OverviewListItem {
  label: string
  value: string
  detail?: string
  color?: string
  tone?: 'default' | 'success' | 'warning' | 'danger'
  filter?: OverviewFilter
}

interface OverviewListSection {
  title: string
  icon?: ReactNode
  items: OverviewListItem[]
  emptyMessage: string
  layout?: 'full' | 'half'
}

interface ActiveOverviewFilterState {
  kind: string
  value?: string
  label?: string
  color?: string
  tone?: 'default' | 'success' | 'warning' | 'danger'
}

interface DeviceOverviewPanelProps<T extends DeviceOverviewItem> {
  title: string
  total: number
  items: T[]
  accentClassName: string
  activeFilters?: ActiveOverviewFilterState[]
  isLoading?: boolean
  onFilter?: (filter: OverviewFilter) => void
}

interface ImpressoraOverviewPanelProps {
  total: number
  items: Array<{
    id: string
    nome_host: string | null
    fabricante: string | null
    modelo: string | null
    numero_serie: string | null
    endereco_ip: string | null
    localidade: string | null
    andar: string | null
    revisao: string | null
    status: boolean | null
  }>
  isLoading?: boolean
  onFilter?: (filter: OverviewFilter) => void
}

interface RackOverviewPanelProps {
  total: number
  items: Array<{
    id: string
    nome_switch: string | null
    localizacao: string | null
    quantidade_portas: number | null
    portas_em_uso: number | null
    portas_livres: number | null
    created_at: string | null
  }>
  isLoading?: boolean
  onFilter?: (filter: OverviewFilter) => void
}

interface ColaboradorOverviewPanelProps {
  total: number
  items: Array<{
    id: string
    setor: string | null
    setor_nome?: string | null
    status: string
    alocacoes_maquinas_ativas?: number
    alocacoes_notebooks_ativas?: number
    alocacoes_aparelhos_ativas?: number
    alocacoes_ramais_ativas?: number
  }>
  metricTotal?: number
  metricItems?: Array<{
    id: string
    setor: string | null
    setor_nome?: string | null
    status: string
    alocacoes_maquinas_ativas?: number
    alocacoes_notebooks_ativas?: number
    alocacoes_aparelhos_ativas?: number
    alocacoes_ramais_ativas?: number
  }>
  activeFilters?: ActiveOverviewFilterState[]
  isLoading?: boolean
  onFilter?: (filter: OverviewFilter) => void
}

interface AuditOverviewPanelProps {
  total: number
  items: AuditLog[]
  isLoading?: boolean
  onFilter?: (filter: OverviewFilter) => void
}

type PieChartItem = {
  distribution: number
  color: string
  label?: string
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

function getOverviewFilterKey(filter: { kind: string; value?: string }) {
  return `${filter.kind}:${filter.value ?? ''}`
}

function getFilterColor(filter?: { color?: string; tone?: 'default' | 'success' | 'warning' | 'danger' }) {
  if (filter?.color) return filter.color
  if (filter?.tone === 'success') return '#10b981'
  if (filter?.tone === 'warning') return '#f59e0b'
  if (filter?.tone === 'danger') return '#ef4444'
  return '#3b82f6'
}

function getSectorColor(seed: string) {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 9973
  }
  return chartColors[hash % chartColors.length]
}

function buildPieGradient(sectors: PieChartItem[]) {
  let cursor = 0
  const stops = sectors.map((sector) => {
    const start = cursor
    cursor += sector.distribution
    return `${sector.color} ${start}% ${cursor}%`
  })

  return stops.length > 0 ? `conic-gradient(${stops.join(', ')})` : 'conic-gradient(#cbd5e1 0% 100%)'
}

function missing(value: unknown) {
  return value === null || value === undefined || value === ''
}

function daysSince(value?: string | null) {
  if (!value) return null
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return null
  return Math.floor((Date.now() - time) / 86_400_000)
}

function groupByLabel<T>(items: T[], getLabel: (item: T) => string, total: number) {
  return Array.from(
    items.reduce((map, item) => {
      const label = getLabel(item)
      map.set(label, (map.get(label) ?? 0) + 1)
      return map
    }, new Map<string, number>())
  )
    .map(([label, count]) => ({
      label,
      value: String(count),
      detail: `${pct(count, total)}% do total`,
      color: getSectorColor(label),
      distribution: pct(count, total),
    }))
    .sort((a, b) => Number(b.value) - Number(a.value))
}

function latestDate(values: Array<string | null | undefined>) {
  return values
    .filter(Boolean)
    .sort((a, b) => new Date(String(b)).getTime() - new Date(String(a)).getTime())[0]
}

function OverviewShell({
  title,
  accentClassName,
  icon,
  metrics,
  chartTitle,
  chartCenter,
  chartCaption,
  chartItems,
  listTitle,
  listItems,
  emptyMessage,
  listSections,
  activeFilters,
  onFilter,
  isLoading = false,
}: {
  title: string
  accentClassName: string
  icon: ReactNode
  metrics: OverviewMetric[]
  chartTitle: string
  chartCenter: string
  chartCaption: string
  chartItems: PieChartItem[]
  listTitle?: string
  listItems?: OverviewListItem[]
  emptyMessage?: string
  listSections?: OverviewListSection[]
  activeFilters?: ActiveOverviewFilterState[]
  onFilter?: (filter: OverviewFilter) => void
  isLoading?: boolean
}) {
  const sections: OverviewListSection[] = listSections ?? [{
    title: listTitle ?? '',
    icon: <Activity className="h-3.5 w-3.5" />,
    items: listItems ?? [],
    emptyMessage: emptyMessage ?? 'Sem dados para compor este painel.',
  }]
  const activeFilterKeys = new Set((activeFilters ?? []).map(getOverviewFilterKey))

  return (
    <section className="mb-5 rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Overview geral</p>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
        </div>
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg text-white', accentClassName)}>
          {icon}
        </span>
      </div>

      {isLoading ? (
        <OverviewLoading accentClassName={accentClassName} />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            {metrics.map(metric => (
              <Metric
                key={metric.label}
                {...metric}
                isSelected={metric.filter ? activeFilterKeys.has(getOverviewFilterKey(metric.filter)) : false}
                onFilter={onFilter}
              />
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-[360px_minmax(0,1fr)]">
            <div className="flex flex-col rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
              <SectionTitle icon={<MapPin className="h-3.5 w-3.5" />} label={chartTitle} />
              <div className="mt-4 flex flex-1 items-center justify-center">
                <div
                  className="relative h-44 w-44 rounded-full"
                  style={{ background: buildPieGradient(chartItems) }}
                  aria-label={chartTitle}
                >
                  <div className="absolute inset-8 flex flex-col items-center justify-center rounded-full bg-white text-center dark:bg-slate-900">
                    <span className="text-xl font-bold text-slate-900 dark:text-white">{chartCenter}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{chartCaption}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-2">
              {sections.map((section) => (
                <div
                  key={section.title}
                  className={cn(
                    'rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40',
                    section.layout !== 'half' && 'xl:col-span-2'
                  )}
                >
                  <SectionTitle icon={section.icon ?? <Activity className="h-3.5 w-3.5" />} label={section.title} />
                  {section.items.length > 0 ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {section.items.map((item) => (
                        <OverviewListCard
                          key={item.label}
                          item={item}
                          isSelected={item.filter ? activeFilterKeys.has(getOverviewFilterKey(item.filter)) : false}
                          onFilter={onFilter}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-400">{section.emptyMessage}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export function DeviceOverviewPanel<T extends DeviceOverviewItem>({
  title,
  total,
  items,
  accentClassName,
  activeFilters = [],
  isLoading = false,
  onFilter,
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
    .map(([setor, value]) => ({
      setor,
      ...value,
      distribution: pct(value.total, analyzedTotal),
      occupancy: pct(value.allocated, value.total),
      color: getSectorColor(setor),
    }))
    .filter(sector => sector.total > 0)
    .sort((a, b) => b.total - a.total)
  const activeFilterKeys = new Set(activeFilters.map(getOverviewFilterKey))

  const latestRevision = items
    .map(getRevisionDate)
    .filter(Boolean)
    .sort((a, b) => new Date(String(b)).getTime() - new Date(String(a)).getTime())[0]

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

      {isLoading ? (
        <OverviewLoading accentClassName={accentClassName} />
      ) : (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <Metric icon={<Layers3 className="h-3.5 w-3.5" />} label="Cadastrados" value={total.toLocaleString('pt-BR')} filter={{ kind: 'all' }} onFilter={onFilter} />
          <Metric icon={<Activity className="h-3.5 w-3.5" />} label="Ocupados" value={allocated.toLocaleString('pt-BR')} tone="danger" filter={{ kind: 'allocated' }} isSelected={activeFilterKeys.has(getOverviewFilterKey({ kind: 'allocated' }))} onFilter={onFilter} />
          <Metric icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Livres" value={free.toLocaleString('pt-BR')} tone="success" filter={{ kind: 'free' }} isSelected={activeFilterKeys.has(getOverviewFilterKey({ kind: 'free' }))} onFilter={onFilter} />
          <Metric icon={<Users className="h-3.5 w-3.5" />} label="Ocupação" value={`${occupancy}%`} tone={occupancy >= 90 ? 'danger' : occupancy >= 50 ? 'warning' : 'success'} />
          <Metric
            icon={<CalendarClock className="h-3.5 w-3.5" />}
            label="Última revisão"
            value={latestRevision ? formatDate(String(latestRevision)) : '—'}
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="flex flex-col rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
            <SectionTitle icon={<MapPin className="h-3.5 w-3.5" />} label="Setores" />
            <div className="mt-4 flex flex-1 items-center justify-center">
              <div
                className="relative h-44 w-44 rounded-full"
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
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {sectors.map(sector => (
                  <OverviewListCard
                    key={sector.setor}
                    onFilter={onFilter}
                    isSelected={activeFilterKeys.has(getOverviewFilterKey({ kind: 'sector', value: sector.setor }))}
                    item={{
                      label: sector.setor,
                      value: `${sector.occupancy}%`,
                      detail: `${sector.allocated}/${sector.total} alocados · ${sector.distribution}% do total`,
                      color: sector.color,
                      filter: { kind: 'sector', value: sector.setor },
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-400">Sem dados para compor setores.</p>
            )}
          </div>
        </div>
      </div>
      )}
    </section>
  )
}

export function ImpressoraOverviewPanel({ total, items, isLoading = false, onFilter }: ImpressoraOverviewPanelProps) {
  const active = items.filter(item => item.status !== false).length
  const inactive = items.filter(item => item.status === false).length
  const stale = items.filter(item => {
    const days = daysSince(item.revisao)
    return days === null || days > 90
  }).length
  const missingData = items.filter(item =>
    [item.nome_host, item.fabricante, item.modelo, item.numero_serie, item.endereco_ip, item.localidade].some(missing)
  ).length
  const attention = items.filter(item => {
    const days = daysSince(item.revisao)
    const hasMissingData = [item.nome_host, item.fabricante, item.modelo, item.numero_serie, item.endereco_ip, item.localidade].some(missing)
    return item.status === false || days === null || days > 90 || hasMissingData
  }).length
  const sectors = groupByLabel(items, item => item.localidade || 'Sem setor', items.length)
  const floors = groupByLabel(items, item => item.andar || 'Sem andar', items.length)
  const noRevision = items.filter(item => !item.revisao).length
  const noIp = items.filter(item => missing(item.endereco_ip)).length
  const noLocation = items.filter(item => missing(item.localidade)).length
  const noIdentity = items.filter(item => missing(item.nome_host) || missing(item.numero_serie)).length

  return (
    <OverviewShell
      title="Impressoras"
      accentClassName="bg-cyan-500"
      icon={<Activity className="h-4 w-4" />}
      metrics={[
        { icon: <Layers3 className="h-3.5 w-3.5" />, label: 'Cadastradas', value: total.toLocaleString('pt-BR'), filter: { kind: 'all' } },
        { icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: 'Ativas', value: active.toLocaleString('pt-BR'), tone: 'success', filter: { kind: 'printer-status', value: 'true' } },
        { icon: <AlertTriangle className="h-3.5 w-3.5" />, label: 'Inativas', value: inactive.toLocaleString('pt-BR'), tone: inactive > 0 ? 'danger' : 'success', filter: { kind: 'printer-status', value: 'false' } },
        { icon: <CalendarClock className="h-3.5 w-3.5" />, label: 'Revisao 3 meses', value: stale.toLocaleString('pt-BR'), tone: stale > 0 ? 'warning' : 'success', filter: { kind: 'printer-stale' } },
        { icon: <ShieldAlert className="h-3.5 w-3.5" />, label: 'Atencao', value: attention.toLocaleString('pt-BR'), tone: attention > 0 ? 'danger' : 'success', filter: { kind: 'printer-attention' } },
      ]}
      chartTitle="Setores"
      chartCenter={sectors.length.toLocaleString('pt-BR')}
      chartCaption="setores"
      chartItems={sectors}
      listSections={[
        {
          title: 'Impressoras por setor',
          icon: <MapPin className="h-3.5 w-3.5" />,
          items: sectors.map(item => ({
            ...item,
            detail: `${item.detail} · ${item.value} impressoras`,
            filter: { kind: 'printer-sector', value: item.label },
          })),
          emptyMessage: 'Sem dados para compor setores.',
          layout: 'half',
        },
        {
          title: 'Impressoras por andar',
          icon: <MapPin className="h-3.5 w-3.5" />,
          items: floors.map(item => ({
            ...item,
            detail: `${item.detail} · ${item.value} impressoras`,
            filter: { kind: 'printer-floor', value: item.label },
          })),
          emptyMessage: 'Sem dados para compor andares.',
          layout: 'half',
        },
        {
          title: 'Pontos de atencao',
          icon: <ShieldAlert className="h-3.5 w-3.5" />,
          items: [
            { label: 'Sem revisao em 3 meses', value: String(stale), detail: 'inclui sem data de revisao', tone: stale > 0 ? 'warning' : 'success', filter: { kind: 'printer-stale' } },
            { label: 'Sem revisao registrada', value: String(noRevision), detail: 'campo de revisao vazio', tone: noRevision > 0 ? 'warning' : 'success', filter: { kind: 'printer-no-revision' } },
            { label: 'Dados faltantes', value: String(missingData), detail: 'campos essenciais incompletos', tone: missingData > 0 ? 'warning' : 'success', filter: { kind: 'printer-missing-data' } },
            { label: 'Sem IP', value: String(noIp), detail: 'endereco de rede ausente', tone: noIp > 0 ? 'warning' : 'success', filter: { kind: 'printer-no-ip' } },
            { label: 'Sem setor', value: String(noLocation), detail: 'localidade nao informada', tone: noLocation > 0 ? 'warning' : 'success', filter: { kind: 'printer-no-sector' } },
            { label: 'Sem identificacao', value: String(noIdentity), detail: 'host ou serie ausentes', tone: noIdentity > 0 ? 'warning' : 'success', filter: { kind: 'printer-no-identity' } },
            { label: 'Inativas', value: String(inactive), detail: `${pct(inactive, items.length)}% do parque`, tone: inactive > 0 ? 'danger' : 'success', filter: { kind: 'printer-status', value: 'false' } },
          ],
          emptyMessage: 'Nenhum ponto de atencao encontrado.',
        },
      ]}
      onFilter={onFilter}
      isLoading={isLoading}
    />
  )
}

export function RackOverviewPanel({ total, items, isLoading = false, onFilter }: RackOverviewPanelProps) {
  const totalPorts = items.reduce((sum, item) => sum + (item.quantidade_portas ?? 0), 0)
  const usedPorts = items.reduce((sum, item) => sum + (item.portas_em_uso ?? 0), 0)
  const occupancy = pct(usedPorts, totalPorts)
  const critical = items.filter(item => {
    if (!item.quantidade_portas || item.portas_em_uso === null || item.portas_em_uso === undefined) return true
    return pct(item.portas_em_uso, item.quantidade_portas) >= 85
  })
  const locations = groupByLabel(items, item => item.localizacao || 'Sem localizacao', items.length)
  const missingPorts = items.filter(item => !item.quantidade_portas).length
  const missingUsedPorts = items.filter(item => item.portas_em_uso === null || item.portas_em_uso === undefined).length
  const criticalList = critical
    .map(item => {
      const rackOccupancy = pct(item.portas_em_uso ?? 0, item.quantidade_portas ?? 0)
      return {
        label: item.nome_switch || item.localizacao || 'Rack sem nome',
        value: item.quantidade_portas ? `${rackOccupancy}%` : '—',
        detail: item.quantidade_portas
          ? `${item.portas_em_uso ?? 0}/${item.quantidade_portas} portas em uso`
          : 'ocupacao sem base completa',
        tone: rackOccupancy >= 95 || !item.quantidade_portas ? 'danger' as const : 'warning' as const,
        filter: { kind: 'rack-id', value: item.id },
      }
    })
    .sort((a, b) => Number.parseInt(b.value) - Number.parseInt(a.value))
    .slice(0, 6)

  return (
    <OverviewShell
      title="Racks"
      accentClassName="bg-violet-500"
      icon={<Activity className="h-4 w-4" />}
      metrics={[
        { icon: <Layers3 className="h-3.5 w-3.5" />, label: 'Cadastrados', value: total.toLocaleString('pt-BR'), filter: { kind: 'all' } },
        { icon: <Activity className="h-3.5 w-3.5" />, label: 'Portas em uso', value: usedPorts.toLocaleString('pt-BR'), tone: occupancy >= 85 ? 'danger' : 'default' },
        { icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: 'Portas livres', value: Math.max(0, totalPorts - usedPorts).toLocaleString('pt-BR'), tone: 'success' },
        { icon: <Users className="h-3.5 w-3.5" />, label: 'Ocupacao', value: `${occupancy}%`, tone: occupancy >= 85 ? 'danger' : occupancy >= 65 ? 'warning' : 'success' },
        { icon: <ShieldAlert className="h-3.5 w-3.5" />, label: 'Criticos', value: critical.length.toLocaleString('pt-BR'), tone: critical.length > 0 ? 'danger' : 'success' },
      ]}
      chartTitle="Localizacoes"
      chartCenter={locations.length.toLocaleString('pt-BR')}
      chartCaption="locais"
      chartItems={locations}
      listSections={[
        {
          title: 'Racks por setor',
          icon: <MapPin className="h-3.5 w-3.5" />,
          items: locations.map(item => ({ ...item, detail: `${item.detail} · racks`, filter: { kind: 'rack-location', value: item.label } })),
          emptyMessage: 'Sem dados para compor setores.',
        },
        {
          title: 'Pontos de atencao',
          icon: <ShieldAlert className="h-3.5 w-3.5" />,
          items: [
            { label: 'Ocupacao critica', value: String(critical.length), detail: 'racks acima de 85% ou sem base', tone: critical.length > 0 ? 'danger' : 'success', filter: { kind: 'rack-critical' } },
            { label: 'Sem total de portas', value: String(missingPorts), detail: 'capacidade nao informada', tone: missingPorts > 0 ? 'warning' : 'success', filter: { kind: 'rack-missing-ports' } },
            { label: 'Sem uso informado', value: String(missingUsedPorts), detail: 'portas em uso ausentes', tone: missingUsedPorts > 0 ? 'warning' : 'success', filter: { kind: 'rack-missing-used' } },
            ...criticalList,
          ],
          emptyMessage: 'Nenhum rack proximo da ocupacao maxima.',
        },
      ]}
      onFilter={onFilter}
      isLoading={isLoading}
    />
  )
}

export function ColaboradorOverviewPanel({
  total,
  items,
  metricTotal = total,
  metricItems = items,
  activeFilters = [],
  isLoading = false,
  onFilter,
}: ColaboradorOverviewPanelProps) {
  const activeItems = items.filter(item => item.status === 'Ativo')
  const metricActiveItems = metricItems.filter(item => item.status === 'Ativo')
  const active = metricActiveItems.length
  const sectors = groupByLabel(items, item => item.setor_nome ?? item.setor ?? 'Sem setor', items.length)
  const metricSectors = groupByLabel(metricItems, item => item.setor_nome ?? item.setor ?? 'Sem setor', metricItems.length)
  const withoutMachine = activeItems.filter(item => !item.alocacoes_maquinas_ativas).length
  const withoutNotebook = activeItems.filter(item => !item.alocacoes_notebooks_ativas).length
  const withoutPhone = activeItems.filter(item => !item.alocacoes_aparelhos_ativas).length
  const withoutExtension = activeItems.filter(item => !item.alocacoes_ramais_ativas).length
  const metricWithoutAny = metricActiveItems.filter(item =>
    !item.alocacoes_maquinas_ativas &&
    !item.alocacoes_notebooks_ativas &&
    !item.alocacoes_aparelhos_ativas &&
    !item.alocacoes_ramais_ativas
  ).length

  return (
    <OverviewShell
      title="Colaboradores"
      accentClassName="bg-emerald-500"
      icon={<Users className="h-4 w-4" />}
      metrics={[
        { icon: <Users className="h-3.5 w-3.5" />, label: 'Em registro', value: metricTotal.toLocaleString('pt-BR'), filter: { kind: 'all' } },
        { icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: 'Ativos', value: active.toLocaleString('pt-BR'), tone: 'success', filter: { kind: 'collaborator-status', value: 'Ativo' } },
        { icon: <MapPin className="h-3.5 w-3.5" />, label: 'Setores', value: metricSectors.length.toLocaleString('pt-BR') },
        { icon: <AlertTriangle className="h-3.5 w-3.5" />, label: 'Sem alocacao', value: metricWithoutAny.toLocaleString('pt-BR'), tone: metricWithoutAny > 0 ? 'warning' : 'success', filter: { kind: 'collaborator-without-any' } },
        { icon: <Activity className="h-3.5 w-3.5" />, label: 'Cobertura', value: `${pct(active - metricWithoutAny, active)}%`, tone: metricWithoutAny > 0 ? 'warning' : 'success' },
      ]}
      chartTitle="Setores"
      chartCenter={sectors.length.toLocaleString('pt-BR')}
      chartCaption="setores"
      chartItems={sectors}
      listSections={[
        {
          title: 'Colaboradores por setor',
          icon: <MapPin className="h-3.5 w-3.5" />,
          items: sectors.map(item => ({ ...item, detail: `${item.detail} · colaboradores`, filter: { kind: 'collaborator-sector', value: item.label } })),
          emptyMessage: 'Sem dados para compor setores.',
        },
        {
          title: 'Ausencias por tipo',
          icon: <Activity className="h-3.5 w-3.5" />,
          items: [
            { label: 'Sem maquina', value: String(withoutMachine), detail: `${pct(withoutMachine, activeItems.length)}% dos colaboradores ativos`, tone: withoutMachine > 0 ? 'warning' : 'success', filter: { kind: 'collaborator-without-machine' } },
            { label: 'Sem notebook', value: String(withoutNotebook), detail: `${pct(withoutNotebook, activeItems.length)}% dos colaboradores ativos`, tone: withoutNotebook > 0 ? 'warning' : 'success', filter: { kind: 'collaborator-without-notebook' } },
            { label: 'Sem telefone', value: String(withoutPhone), detail: `${pct(withoutPhone, activeItems.length)}% dos colaboradores ativos`, tone: withoutPhone > 0 ? 'warning' : 'success', filter: { kind: 'collaborator-without-phone' } },
            { label: 'Sem ramal', value: String(withoutExtension), detail: `${pct(withoutExtension, activeItems.length)}% dos colaboradores ativos`, tone: withoutExtension > 0 ? 'warning' : 'success', filter: { kind: 'collaborator-without-extension' } },
          ],
          emptyMessage: 'Sem ausencias por tipo.',
        },
      ]}
      activeFilters={activeFilters}
      onFilter={onFilter}
      isLoading={isLoading}
    />
  )
}

export function notifyOverviewFilter(filters: ActiveOverviewFilterState[]) {
  const toastId = 'overview-filter-toast'
  const activeFilters = filters.filter(filter => filter.kind !== 'all')
  const title = activeFilters.length === 0
    ? 'Overview em visão geral'
    : activeFilters.length === 1
      ? `Overview focado em ${activeFilters[0].label ?? 'recorte selecionado'}`
      : `Overview com ${activeFilters.length} filtros ativos`
  const detail = activeFilters.length === 0
    ? 'Tabela exibindo todos os colaboradores.'
    : activeFilters.length === 1
      ? 'Tabela filtrada pelo recorte selecionado no overview.'
      : `Tabela filtrada por ${activeFilters.map(filter => filter.label ?? 'recorte').join(', ')}.`
  const colors = activeFilters.length > 0
    ? activeFilters.map(getFilterColor)
    : ['#3b82f6']

  toast.custom((id) => (
    <div className="flex w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950">
      <span className="flex w-1.5 shrink-0 flex-col">
        {colors.map((color, index) => (
          <span
            key={`${color}-${index}`}
            className="min-h-1 flex-1"
            style={{ backgroundColor: color }}
          />
        ))}
      </span>
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
  ), { id: toastId })
}

export function AuditOverviewPanel({ total, items, isLoading = false, onFilter }: AuditOverviewPanelProps) {
  const edits = items.filter(item => item.acao === 'UPDATE' || item.acao === 'EDITAR_ALOCACAO')
  const deletes = items.filter(item => item.acao === 'DELETE')
  const latest = latestDate(edits.map(item => item.created_at)) ?? latestDate(items.map(item => item.created_at))
  const users = groupByLabel(edits, item => item.usuario_nome || 'Sem responsavel', edits.length)
  const actions = groupByLabel(items, item => ACAO_LABELS[item.acao] || item.acao || 'Sem acao', items.length)
  const latestLabel = latest ? formatDate(String(latest)) : '—'

  return (
    <OverviewShell
      title="Auditoria"
      accentClassName="bg-amber-500"
      icon={<ShieldAlert className="h-4 w-4" />}
      metrics={[
        { icon: <Layers3 className="h-3.5 w-3.5" />, label: 'Registros', value: total.toLocaleString('pt-BR'), filter: { kind: 'all' } },
        { icon: <Activity className="h-3.5 w-3.5" />, label: 'Edicoes', value: edits.length.toLocaleString('pt-BR'), tone: 'warning', filter: { kind: 'audit-edits' } },
        { icon: <Users className="h-3.5 w-3.5" />, label: 'Responsaveis', value: users.length.toLocaleString('pt-BR') },
        { icon: <CalendarClock className="h-3.5 w-3.5" />, label: 'Ultima edicao', value: latestLabel },
        { icon: <ShieldAlert className="h-3.5 w-3.5" />, label: 'Exclusoes', value: deletes.length.toLocaleString('pt-BR'), tone: deletes.length > 0 ? 'danger' : 'success', filter: { kind: 'audit-action', value: 'DELETE' } },
      ]}
      chartTitle="Responsaveis"
      chartCenter={users.length.toLocaleString('pt-BR')}
      chartCaption="usuarios"
      chartItems={users}
      listSections={[
        {
          title: 'Edicoes por responsavel',
          icon: <Users className="h-3.5 w-3.5" />,
          items: users.map(item => ({ ...item, detail: `${item.detail} · edicoes`, filter: { kind: 'audit-user', value: item.label } })),
          emptyMessage: 'Sem edicoes por responsavel.',
        },
        {
          title: 'Acoes mais feitas',
          icon: <Activity className="h-3.5 w-3.5" />,
          items: actions.map(item => ({ ...item, detail: `${item.detail} · ocorrencias`, filter: { kind: 'audit-action-label', value: item.label } })),
          emptyMessage: 'Sem dados para compor auditoria.',
          layout: 'half',
        },
        {
          title: 'Pontos de cuidado',
          icon: <ShieldAlert className="h-3.5 w-3.5" />,
          items: [
            { label: 'Exclusoes registradas', value: String(deletes.length), detail: `${pct(deletes.length, total)}% dos registros`, tone: deletes.length > 0 ? 'danger' : 'success', filter: { kind: 'audit-action', value: 'DELETE' } },
          ],
          emptyMessage: 'Sem pontos de cuidado.',
          layout: 'half',
        },
      ]}
      onFilter={onFilter}
      isLoading={isLoading}
    />
  )
}

function OverviewLoading({ accentClassName }: { accentClassName: string }) {
  return (
    <div className="space-y-4" aria-label="Carregando overview">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="mb-3 flex items-center gap-2">
              <span className={cn('h-3.5 w-3.5 rounded-full animate-pulse', accentClassName)} />
              <div className="h-3 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="h-6 w-14 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="mb-4 h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="flex h-44 items-center justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-slate-200 border-t-blue-500 dark:border-slate-800 dark:border-t-blue-400 animate-spin" />
          </div>
        </div>

        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="mb-4 h-3 w-36 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-md bg-white px-3 py-2 dark:bg-slate-900">
                <div className="mb-2 flex items-center gap-2">
                  <span className={cn('h-2.5 w-2.5 rounded-full animate-pulse', accentClassName)} />
                  <div className="h-3 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="h-3 w-36 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
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
  filter,
  isSelected = false,
  onFilter,
}: {
  icon: ReactNode
  label: string
  value: string
  tone?: 'default' | 'success' | 'warning' | 'danger'
  filter?: OverviewFilter
  isSelected?: boolean
  onFilter?: (filter: OverviewFilter) => void
}) {
  const toneClassName = {
    default: 'text-slate-700 dark:text-slate-200',
    success: 'text-emerald-600 dark:text-emerald-300',
    warning: 'text-amber-600 dark:text-amber-300',
    danger: 'text-red-600 dark:text-red-300',
  }[tone]

  const Component = filter && onFilter ? 'button' : 'div'
  const selectionColor = getFilterColor({ color: filter?.color, tone })

  return (
    <Component
      type={Component === 'button' ? 'button' : undefined}
      onClick={filter && onFilter ? () => onFilter({ ...filter, label, tone }) : undefined}
      className={cn(
        'relative w-full rounded-lg border bg-slate-50 p-3 text-left dark:bg-slate-950/40',
        isSelected ? 'border-transparent ring-2' : 'border-slate-100 dark:border-slate-800',
        filter && onFilter && 'transition hover:border-blue-300 hover:bg-blue-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:border-blue-700 dark:hover:bg-blue-950/20'
      )}
      style={isSelected ? { '--tw-ring-color': selectionColor } as CSSProperties : undefined}
    >
      {isSelected && (
        <span
          className="pointer-events-none absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: selectionColor }}
        >
          x
        </span>
      )}
      <div className="mb-2 flex items-center gap-1.5 text-slate-400">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className={cn('text-lg font-bold tabular-nums', toneClassName)}>{value}</p>
    </Component>
  )
}

function OverviewListCard({
  item,
  isSelected = false,
  onFilter,
}: {
  item: OverviewListItem
  isSelected?: boolean
  onFilter?: (filter: OverviewFilter) => void
}) {
  const toneClassName = {
    default: 'text-slate-400',
    success: 'text-emerald-600 dark:text-emerald-300',
    warning: 'text-amber-600 dark:text-amber-300',
    danger: 'text-red-600 dark:text-red-300',
  }[item.tone ?? 'default']

  const Component = item.filter && onFilter ? 'button' : 'div'
  const selectionColor = getFilterColor({ color: item.color, tone: item.tone })

  return (
    <Component
      type={Component === 'button' ? 'button' : undefined}
      onClick={item.filter && onFilter
        ? () => onFilter({
            ...(item.filter as OverviewFilter),
            label: item.label,
            color: item.color,
            tone: item.tone,
          })
        : undefined}
      className={cn(
        'relative w-full rounded-md border bg-white px-3 py-2 text-left dark:bg-slate-900',
        isSelected ? 'border-transparent ring-2' : 'border-transparent',
        item.filter && onFilter && 'transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-blue-950/20'
      )}
      style={isSelected ? { '--tw-ring-color': selectionColor } as CSSProperties : undefined}
    >
      {isSelected && (
        <span
          className="pointer-events-none absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: selectionColor }}
        >
          x
        </span>
      )}
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200">
          <span
            className={cn('h-2.5 w-2.5 shrink-0 rounded-full', item.color ? '' : 'bg-slate-300 dark:bg-slate-700')}
            style={item.color ? { backgroundColor: item.color } : undefined}
          />
          <span className="truncate">{item.label}</span>
        </span>
        <span className={cn('text-xs font-semibold tabular-nums', toneClassName)}>{item.value}</span>
      </div>
      {item.detail && <p className="text-[11px] text-slate-400">{item.detail}</p>}
    </Component>
  )
}

export function OverviewFilterToastDescription({
  label,
  filter,
}: {
  label: string
  filter: OverviewFilter
}) {
  const toneClassName = {
    default: 'bg-slate-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-red-400',
  }[filter.tone ?? 'default']

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn('h-2.5 w-2.5 rounded-full', filter.color ? '' : toneClassName)}
        style={filter.color ? { backgroundColor: filter.color } : undefined}
      />
      <span>{label}</span>
    </span>
  )
}
