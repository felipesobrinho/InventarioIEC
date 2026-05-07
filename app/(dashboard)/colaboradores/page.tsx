'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/tables/data-table'
import { ColaboradorOverviewPanel, type OverviewFilter, OverviewFilterToastDescription } from '@/components/tables/device-overview-panel'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { ColaboradorModal } from '@/components/modals/colaborador-modal'
import { SetorSelect } from '@/components/modals/setor-select'
import { Search } from 'lucide-react'
import type { Colaborador, PaginatedResponse } from '@/types'
import { CriarColaboradorModal } from '@/components/modals/criar-colaborador-modal'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

const columns: ColumnDef<Colaborador>[] = [
  { accessorKey: 'codigo', header: 'Código', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'nome', header: 'Nome', cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span> },
  {
    accessorKey: 'setor',
    header: 'Setor',
    cell: ({ row }) => row.original.setor_nome ?? row.original.setor ?? '—',
  },
  {
    accessorKey: 'status', header: 'Status',
    cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
  },
]

export default function ColaboradoresPage() {
  const searchParams = useSearchParams()

  const [data, setData] = useState<Colaborador[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [overviewData, setOverviewData] = useState<Colaborador[]>([])
  const [overviewTotal, setOverviewTotal] = useState(0)
  const [overviewLoading, setOverviewLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Colaborador | null>(null)
  const [showCriar, setShowCriar] = useState(false)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [setorIdFiltro, setSetorIdFiltro] = useState<string | null>(searchParams.get('setor_id'))
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeOverviewFilter, setActiveOverviewFilter] = useState<{
    label: string
    predicate: (item: Colaborador) => boolean
  } | null>(null)
  const [overviewFilterLoading, setOverviewFilterLoading] = useState(false)

  console.log(data)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    if (setorIdFiltro) params.set('setor_id', setorIdFiltro)
    if (status) params.set('status', status)
    const res = await fetch(`/api/colaboradores?${params}`)
    const json: PaginatedResponse<Colaborador> = await res.json()
    setData(json.data)
    setTotal(json.total)
    setTotalPages(json.totalPages)
    setLoading(false)
  }, [page, search, setorIdFiltro, status])

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

    const predicates: Record<string, { label: string; predicate: (item: Colaborador) => boolean }> = {
      'collaborator-status': {
        label: `Colaboradores ${filter.value ?? ''}`,
        predicate: (item) => item.status === filter.value,
      },
      'collaborator-sector': {
        label: `Setor: ${filter.value ?? 'Sem setor'}`,
        predicate: (item) => (item.setor || 'Sem setor') === filter.value,
      },
      'collaborator-without-any': {
        label: 'Colaboradores sem alocacao',
        predicate: (item) => !item.alocacoes_maquinas_ativas && !item.alocacoes_notebooks_ativas && !item.alocacoes_aparelhos_ativas && !item.alocacoes_ramais_ativas,
      },
      'collaborator-without-machine': {
        label: 'Colaboradores sem maquina',
        predicate: (item) => !item.alocacoes_maquinas_ativas,
      },
      'collaborator-without-notebook': {
        label: 'Colaboradores sem notebook',
        predicate: (item) => !item.alocacoes_notebooks_ativas,
      },
      'collaborator-without-phone': {
        label: 'Colaboradores sem telefone',
        predicate: (item) => !item.alocacoes_aparelhos_ativas,
      },
      'collaborator-without-extension': {
        label: 'Colaboradores sem ramal',
        predicate: (item) => !item.alocacoes_ramais_ativas,
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
        const params = new URLSearchParams({ page: '1', limit: '10000', sort: 'nome', dir: 'asc', overview: 'true' })
        const res = await fetch(`/api/colaboradores?${params}`)
        const json: PaginatedResponse<Colaborador> = await res.json()
        if (!cancelled) {
          setOverviewData(json.data)
          setOverviewTotal(json.total)
        }
      } catch (error) {
        console.error('[colaboradores overview]', error)
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
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Buscar por nome..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <SetorSelect
        value={setorIdFiltro}
        onChange={(value) => {
          setSetorIdFiltro(value)
          setPage(1)
        }}
        placeholder="Filtrar por setor..."
      />
      <select
        value={status}
        onChange={(e) => { setStatus(e.target.value); setPage(1) }}
        className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Todos os status</option>
        <option value="Ativo">Ativo</option>
        <option value="Inativo">Inativo</option>
      </select>
    </>
  )

  return (
    <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">
      <PageHeader title="Colaboradores" total={total}>
        <button type="button" onClick={() => setShowCriar(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition">
          <Plus className="w-4 h-4" /> Novo colaborador
        </button>
      </PageHeader>
      <ColaboradorOverviewPanel
        total={overviewTotal || total}
        items={overviewData}
        isLoading={overviewLoading}
        onFilter={applyOverviewFilter}
      />
      <DataTable
        columns={columns}
        data={tableData}
        total={tableTotal}
        page={page}
        totalPages={tableTotalPages}
        onPageChange={setPage}
        onRowClick={setSelected}
        isLoading={loading || overviewFilterLoading}
        filters={filters}
      />
      {selected && <ColaboradorModal colaborador={selected} onClose={() => setSelected(null)} onRefresh={() => setRefreshKey(k => k + 1)}/>}
      {showCriar && <CriarColaboradorModal onClose={() => setShowCriar(false)} onRefresh={() => setRefreshKey(k => k + 1)} />}
    </div>
  )
}
