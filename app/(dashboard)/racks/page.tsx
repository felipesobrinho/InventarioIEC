'use client'
import React from 'react'

import { useState, useEffect, useCallback } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/tables/data-table'
import { RackOverviewPanel, type OverviewFilter, OverviewFilterToastDescription } from '@/components/tables/device-overview-panel'
import { PageHeader } from '@/components/layout/page-header'
import { RackModal } from '@/components/modals/rack-modal'
import { Search } from 'lucide-react'
import type { Rack, PaginatedResponse } from '@/types'
import { CriarRackModal } from '@/components/modals/criar-rack-modal'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

const columns: ColumnDef<Rack>[] = [
  { accessorKey: 'nome_switch', header: 'Switch', cell: ({ getValue }) => <span className="font-medium">{getValue() as string || '—'}</span> },
  { accessorKey: 'marca_switch', header: 'Marca', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'localizacao', header: 'Localização', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'numero_patrimonio', header: 'Patrimônio', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'quantidade_portas', header: 'Total Portas', cell: ({ getValue }) => getValue() ?? '—' },
  { accessorKey: 'portas_em_uso', header: 'Em Uso', cell: ({ getValue }) => getValue() ?? '—' },
  { accessorKey: 'portas_livres', header: 'Livres', cell: ({ getValue }): React.ReactNode => {
    const v = getValue() as number | null
    if (v === null || v === undefined) return '—'
    return (
      <span className={v > 0 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-500 font-medium'}>
        {v}
      </span>
    )
  } },
]

function getRackOccupancy(item: Rack) {
  if (!item.quantidade_portas) return 0
  return Math.round(((item.portas_em_uso ?? 0) / item.quantidade_portas) * 100)
}

export default function RacksPage() {
  const [data, setData] = useState<Rack[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [overviewData, setOverviewData] = useState<Rack[]>([])
  const [overviewTotal, setOverviewTotal] = useState(0)
  const [overviewLoading, setOverviewLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Rack | null>(null)
  const [search, setSearch] = useState('')
  const [marca, setMarca] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [showCriar, setShowCriar] = useState(false)
  const [activeOverviewFilter, setActiveOverviewFilter] = useState<{
    label: string
    predicate: (item: Rack) => boolean
  } | null>(null)
  const [overviewFilterLoading, setOverviewFilterLoading] = useState(false)
  function refresh() { setRefreshKey(k => k + 1) }

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    if (marca) params.set('marca', marca)
    const res = await fetch(`/api/racks?${params}`)
    const json: PaginatedResponse<Rack> = await res.json()
    setData(json.data); setTotal(json.total); setTotalPages(json.totalPages)
    setLoading(false)
  }, [page, search, marca])

  useEffect(() => { void Promise.resolve().then(fetchData) }, [fetchData, refreshKey])

  const filteredOverviewData = activeOverviewFilter
    ? overviewData.filter(activeOverviewFilter.predicate)
    : null
  const tableData = filteredOverviewData
    ? filteredOverviewData.slice((page - 1) * 20, page * 20)
    : data
  const tableTotal = filteredOverviewData?.length ?? total
  const tableTotalPages = filteredOverviewData ? Math.max(1, Math.ceil(filteredOverviewData.length / 20)) : totalPages

  function applyOverviewFilter(filter: OverviewFilter) {
    if (filter.kind === 'all') {
      setActiveOverviewFilter(null)
      setPage(1)
      toast.success('Filtro do overview removido.')
      return
    }

    const predicates: Record<string, { label: string; predicate: (item: Rack) => boolean }> = {
      'rack-location': {
        label: `Setor: ${filter.value ?? 'Sem localizacao'}`,
        predicate: (item) => (item.localizacao || 'Sem localizacao') === filter.value,
      },
      'rack-critical': {
        label: 'Racks com ocupacao critica',
        predicate: (item) => !item.quantidade_portas || item.portas_em_uso === null || item.portas_em_uso === undefined || getRackOccupancy(item) >= 85,
      },
      'rack-missing-ports': {
        label: 'Racks sem total de portas',
        predicate: (item) => !item.quantidade_portas,
      },
      'rack-missing-used': {
        label: 'Racks sem uso informado',
        predicate: (item) => item.portas_em_uso === null || item.portas_em_uso === undefined,
      },
      'rack-id': {
        label: filter.label ?? 'Rack selecionado',
        predicate: (item) => item.id === filter.value,
      },
    }

    const nextFilter = predicates[filter.kind]
    if (!nextFilter) return

    const description = <OverviewFilterToastDescription label={nextFilter.label} filter={filter} />
    const toastId = toast.loading('Aplicando filtro do overview...', { description })
    setOverviewFilterLoading(true)
    window.setTimeout(() => {
      setActiveOverviewFilter(nextFilter)
      setPage(1)
      setOverviewFilterLoading(false)
      toast.success('Filtro aplicado.', { id: toastId, description })
    }, 120)
  }

  useEffect(() => {
    let cancelled = false
    async function fetchOverview() {
      setOverviewLoading(true)
      try {
        const params = new URLSearchParams({ page: '1', limit: '10000', sort: 'created_at', dir: 'desc' })
        const res = await fetch(`/api/racks?${params}`)
        const json: PaginatedResponse<Rack> = await res.json()
        if (!cancelled) {
          setOverviewData(json.data)
          setOverviewTotal(json.total)
        }
      } catch (error) {
        console.error('[racks overview]', error)
      } finally {
        if (!cancelled) setOverviewLoading(false)
      }
    }

    fetchOverview()
    return () => { cancelled = true }
  }, [refreshKey])

  const filters = (
    <>
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Buscar por switch ou localização..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <input value={marca} onChange={(e) => { setMarca(e.target.value); setPage(1) }} placeholder="Marca..."
        className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-36" />
    </>
  )

  return (
    <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">
      <PageHeader title="Racks" total={total}>
        <button type="button" onClick={() => setShowCriar(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition">
          <Plus className="w-4 h-4" /> Novo rack
        </button>
      </PageHeader>
      <RackOverviewPanel
        total={overviewTotal || total}
        items={overviewData}
        isLoading={overviewLoading}
        onFilter={applyOverviewFilter}
      />
      <DataTable columns={columns} data={tableData} total={tableTotal} page={page} totalPages={tableTotalPages}
        onPageChange={setPage} onRowClick={setSelected} isLoading={loading || overviewFilterLoading} filters={filters} />
      {showCriar && (
        <CriarRackModal onClose={() => setShowCriar(false)} onRefresh={refresh} />
      )}
      {selected && <RackModal rack={selected} onClose={() => setSelected(null)} onRefresh={fetchData} />}
    </div>
  )
}
