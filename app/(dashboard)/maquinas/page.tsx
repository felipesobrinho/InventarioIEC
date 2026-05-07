'use client'

import { useState, useEffect, useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/tables/data-table'
import { DeviceOverviewPanel, type OverviewFilter, OverviewFilterToastDescription } from '@/components/tables/device-overview-panel'
import { PageHeader } from '@/components/layout/page-header'
import { CategoriaBadge } from '@/components/dashboard/status-badge'
import { MaquinaModal } from '@/components/modals/maquina-modal'
import { CriarMaquinaModal } from '@/components/modals/criar-maquina-modal'
import { SetorSelect } from '@/components/modals/setor-select'
import { Search, Plus } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import type { Maquina, PaginatedResponse } from '@/types'
import { toast } from 'sonner'

function isAllocated(item: Maquina) {
  return (item.alocacoes_ativas?.length ?? 0) > 0 || Boolean(item.alocacao_ativa)
}

export default function MaquinasPage() {
  const [data, setData] = useState<Maquina[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [overviewData, setOverviewData] = useState<Maquina[]>([])
  const [overviewTotal, setOverviewTotal] = useState(0)
  const [overviewLoading, setOverviewLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Maquina | null>(null)
  const [showCriar, setShowCriar] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeOverviewFilter, setActiveOverviewFilter] = useState<{
    label: string
    predicate: (item: Maquina) => boolean
  } | null>(null)
  const [overviewFilterLoading, setOverviewFilterLoading] = useState(false)

  // Filtros
  const [search, setSearch] = useState('')
  const [setorIdFiltro, setSetorIdFiltro] = useState<string | null>(null)
  const [categoria, setCategoria] = useState('')
  const [fabricante, setFabricante] = useState('')
  const [alocacao, setAlocacao] = useState('')
  const [sort, setSort] = useState('nome_host')
  const [dir, setDir] = useState<'asc' | 'desc'>('asc')

  const searchParams = useSearchParams()
  const inspectId = searchParams.get('inspect')

  function refresh() { setRefreshKey(k => k + 1) }

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function fetchData() {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        sort,
        dir,
      })
      if (search)    params.set('search',    search)
      if (setorIdFiltro)     params.set('setor_id',     setorIdFiltro)
      if (categoria) params.set('categoria', categoria)
      if (fabricante)params.set('fabricante',fabricante)
      if (alocacao)  params.set('alocacao',  alocacao)

      try {
        const res = await fetch(`/api/maquinas?${params}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: PaginatedResponse<Maquina> = await res.json()
        if (!cancelled) {
          setData(json.data)
          setTotal(json.total)
          setTotalPages(json.totalPages)
        }
      } catch (err) {
        console.error('[maquinas page]', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [page, search, setorIdFiltro, categoria, fabricante, alocacao, sort, dir, refreshKey])

  useEffect(() => {
    let cancelled = false
    setOverviewLoading(true)

    async function fetchOverview() {
      try {
        const params = new URLSearchParams({
          page: '1',
          limit: '10000',
          sort: 'nome_host',
          dir: 'asc',
        })
        const res = await fetch(`/api/maquinas?${params}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: PaginatedResponse<Maquina> = await res.json()
        if (!cancelled) {
          setOverviewData(json.data)
          setOverviewTotal(json.total)
        }
      } catch (err) {
        console.error('[maquinas overview]', err)
      } finally {
        if (!cancelled) setOverviewLoading(false)
      }
    }

    fetchOverview()
    return () => { cancelled = true }
  }, [refreshKey])

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

    const predicates: Record<string, { label: string; predicate: (item: Maquina) => boolean }> = {
      allocated: { label: 'Máquinas ocupadas', predicate: isAllocated },
      free: { label: 'Máquinas livres', predicate: (item) => !isAllocated(item) },
      sector: {
        label: `Setor: ${filter.value ?? 'Sem setor'}`,
        predicate: (item) => (item.setor || item.alocacao_ativa?.colaborador.setor || 'Sem setor') === filter.value,
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
    if (!inspectId || data.length === 0) return
    const found = data.find(d => d.id === inspectId)
    if (found) setSelected(found)
  }, [inspectId, data])

  useEffect(() => {
    if (!inspectId) return
    fetch(`/api/maquinas/${inspectId}`)
      .then(r => r.ok ? r.json() : null)
      .then(item => { if (item) setSelected(item) })
      .catch(() => {})
  }, [inspectId])

  const columns = useMemo<ColumnDef<Maquina, unknown>[]>(() => [
    {
      accessorKey: 'nome_host',
      header: 'Máquina',
      cell: ({ row }) => (
        <div>
          <span className="font-medium text-slate-900 dark:text-slate-100">{row.original.nome_host || row.original.identificador || '—'}</span>
          <p className="text-xs text-slate-400">{row.original.endereco_ip || row.original.modelo || 'Sem modelo'}</p>
        </div>
      ),
    },
    {
      accessorKey: 'identificador',
      header: 'ID',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.identificador || '—'}</span>,
    },
    {
      accessorKey: 'categoria',
      header: 'Categoria',
      cell: ({ row }) => <CategoriaBadge categoria={row.original.categoria} />,
    },
    {
      accessorKey: 'setor',
      header: 'Setor',
      cell: ({ row }) => row.original.setor_nome ?? row.original.setor ?? '—',
    },
    {
      id: 'alocado',
      header: 'Uso',
      cell: ({ row }) => {
        const alocacoes = row.original.alocacoes_ativas ?? []
        if (alocacoes.length === 0) {
          return <span className="text-slate-400 text-xs">Livre</span>
        }
        if (alocacoes.length === 1) {
          return (
            <span className="text-green-600 dark:text-green-400 text-xs font-medium">
              {alocacoes[0].colaborador.nome}
            </span>
          )
        }
        return (
          <span className="inline-flex items-center gap-1.5">
            <span className="text-green-600 dark:text-green-400 text-xs font-medium">
              {alocacoes[0].colaborador.nome}
            </span>
            <span className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              +{alocacoes.length - 1}
            </span>
          </span>
        )
      },
    },
  ], [])

  const inputCls = "px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"

  const filters = (
    <>
      {/* Busca */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Nome, identificador ou colaborador..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Setor */}
      <SetorSelect
        value={setorIdFiltro}
        onChange={(value) => {
          setSetorIdFiltro(value)
          setPage(1)
        }}
        placeholder="Filtrar por setor..."
      />

      {/* Categoria */}
      <select
        value={categoria}
        onChange={(e) => { setCategoria(e.target.value); setPage(1) }}
        className={inputCls}
      >
        <option value="">Todas as categorias</option>
        <option value="Administrativa">Administrativa</option>
        <option value="Academica">Acadêmica</option>
      </select>

      {/* Fabricante */}
      <input
        value={fabricante}
        onChange={(e) => { setFabricante(e.target.value); setPage(1) }}
        placeholder="Fabricante..."
        className={`${inputCls} w-32`}
      />

      {/* Disponibilidade */}
      <select
        value={alocacao}
        onChange={(e) => { setAlocacao(e.target.value); setPage(1) }}
        className={inputCls}
      >
        <option value="">Todos</option>
        <option value="alocado">Alocados</option>
        <option value="livre">Disponíveis</option>
      </select>

      {/* Ordenação */}
      <select
        value={`${sort}:${dir}`}
        onChange={(e) => {
          const [s, d] = e.target.value.split(':')
          setSort(s)
          setDir(d as 'asc' | 'desc')
          setPage(1)
        }}
        className={inputCls}
      >
        <option value="nome_host:asc">Nome A→Z</option>
        <option value="nome_host:desc">Nome Z→A</option>
        <option value="created_at:desc">Mais recentes</option>
        <option value="created_at:asc">Mais antigos</option>
        <option value="fabricante:asc">Fabricante A→Z</option>
      </select>
    </>
  )

  return (
    <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">
      <PageHeader title="Máquinas" total={total}>
        <button
          type="button"
          onClick={() => setShowCriar(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
        >
          <Plus className="w-4 h-4" /> Nova máquina
        </button>
      </PageHeader>

      <DeviceOverviewPanel
        title="Máquinas"
        total={overviewTotal || total}
        items={overviewData}
        accentClassName="bg-blue-500"
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

      {selected && (
        <MaquinaModal
          maquina={selected}
          onClose={() => setSelected(null)}
          onRefresh={refresh}
        />
      )}
      {showCriar && (
        <CriarMaquinaModal
          onClose={() => setShowCriar(false)}
          onRefresh={refresh}
        />
      )}
    </div>
  )
}
