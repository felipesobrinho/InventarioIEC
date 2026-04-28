'use client'

import { useState, useEffect } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/tables/data-table'
import { DeviceOverviewPanel } from '@/components/tables/device-overview-panel'
import { PageHeader } from '@/components/layout/page-header'
import { BoolBadge } from '@/components/dashboard/status-badge'
import { AparelhoModal } from '@/components/modals/aparelho-modal'
import { Search } from 'lucide-react'
import { mapTipoAparelho } from '@/lib/utils'
import type { Aparelho, PaginatedResponse } from '@/types'
import { CriarAparelhoModal } from '@/components/modals/criar-aparelho-modal'
import { useSearchParams } from 'next/navigation'
import { Plus } from 'lucide-react'

const columns: ColumnDef<Aparelho>[] = [
  {
    accessorKey: 'modelo',
    header: 'Aparelho',
    cell: ({ row }) => (
      <div>
        <span className="font-medium text-slate-900 dark:text-slate-100">{row.original.modelo || '—'}</span>
        <p className="text-xs text-slate-400">{mapTipoAparelho(row.original.tipo)}</p>
      </div>
    ),
  },
  { accessorKey: 'setor', header: 'Setor', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => <BoolBadge value={getValue() as boolean} labelTrue="Ativo" labelFalse="Inativo" /> },
  { accessorKey: 'chip', header: 'Chip', cell: ({ getValue }) => <BoolBadge value={getValue() as boolean} /> },
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
]

export default function AparelhosPage() {
  const [data, setData] = useState<Aparelho[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [overviewData, setOverviewData] = useState<Aparelho[]>([])
  const [overviewTotal, setOverviewTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Aparelho | null>(null)
  const [showCriar, setShowCriar] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Filtros
  const [search, setSearch] = useState('')
  const [setor, setSetor] = useState('')
  const [status, setStatus] = useState('')
  const [chip, setChip] = useState('')
  const [alocacao, setAlocacao] = useState('')   // 'alocado' | 'livre' | ''
  const [sort, setSort] = useState('modelo')
  const [dir, setDir] = useState<'asc' | 'desc'>('asc')

  function refresh() { setRefreshKey(k => k + 1) }
  const searchParams = useSearchParams()
  const inspectId = searchParams.get('inspect')

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
      if (setor)     params.set('setor',     setor)
      if (status !== '') params.set('status', status)
      if (chip !== '') params.set('chip', chip)
      if (alocacao)  params.set('alocacao',  alocacao)

      try {
        const res = await fetch(`/api/aparelhos?${params}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: PaginatedResponse<Aparelho> = await res.json()
        if (!cancelled) {
          setData(json.data)
          setTotal(json.total)
          setTotalPages(json.totalPages)
        }
      } catch (err) {
        console.error('[aparelhos page]', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [page, search, setor, status, chip, alocacao, sort, dir, refreshKey])

  useEffect(() => {
    let cancelled = false

    async function fetchOverview() {
      try {
        const params = new URLSearchParams({
          page: '1',
          limit: '10000',
          sort: 'modelo',
          dir: 'asc',
        })
        const res = await fetch(`/api/aparelhos?${params}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: PaginatedResponse<Aparelho> = await res.json()
        if (!cancelled) {
          setOverviewData(json.data)
          setOverviewTotal(json.total)
        }
      } catch (err) {
        console.error('[aparelhos overview]', err)
      }
    }

    fetchOverview()
    return () => { cancelled = true }
  }, [refreshKey])

  useEffect(() => {
    if (!inspectId || data.length === 0) return
    const found = data.find(d => d.id === inspectId)
    if (found) setSelected(found)
  }, [inspectId, data])

  useEffect(() => {
    if (!inspectId) return
    fetch(`/api/aparelhos/${inspectId}`)
      .then(r => r.ok ? r.json() : null)
      .then(item => { if (item) setSelected(item) })
      .catch(() => {})
  }, [inspectId])

  const inputCls = "px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"

  const filters = (
    <>
      {/* Busca */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Modelo ou colaborador..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Setor */}
      <input
        value={setor}
        onChange={(e) => { setSetor(e.target.value); setPage(1) }}
        placeholder="Setor..."
        className={`${inputCls} w-32`}
      />

      {/* Status */}
      <select
        value={status}
        onChange={(e) => { setStatus(e.target.value); setPage(1) }}
        className={inputCls}
      >
        <option value="">Todos os status</option>
        <option value="true">Ativo</option>
        <option value="false">Inativo</option>
      </select>

      {/* Chip */}
      <select
        value={chip}
        onChange={(e) => { setChip(e.target.value); setPage(1) }}
        className={inputCls}
      >
        <option value="">Com/sem chip</option>
        <option value="true">Com chip</option>
        <option value="false">Sem chip</option>
      </select>

      {/* Alocação */}
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
        <option value="modelo:asc">Modelo A→Z</option>
        <option value="modelo:desc">Modelo Z→A</option>
        <option value="created_at:desc">Mais recentes</option>
        <option value="created_at:asc">Mais antigos</option>
        <option value="tipo:asc">Tipo A→Z</option>
        <option value="setor:asc">Setor A→Z</option>
      </select>
    </>
  )

  return (
    <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">
      <PageHeader title="Aparelhos" total={total}>
      <button type="button" onClick={() => setShowCriar(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition">
        <Plus className="w-4 h-4" /> Novo aparelho
      </button>
    </PageHeader>
      <DeviceOverviewPanel
        title="Aparelhos"
        total={overviewTotal || total}
        items={overviewData}
        selected={selected}
        accentClassName="bg-cyan-500"
        getTitle={(item) => item.modelo || 'Aparelho'}
        getSubtitle={(item) => mapTipoAparelho(item.tipo)}
        getMeta={(item) => (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <BoolBadge value={item.status} labelTrue="Ativo" labelFalse="Inativo" />
            {item.setor && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-300">{item.setor}</span>}
          </div>
        )}
      />

      <DataTable columns={columns} data={data} total={total} page={page} totalPages={totalPages}
        onPageChange={setPage} onRowClick={setSelected} isLoading={loading} filters={filters} />
      {selected && <AparelhoModal aparelho={selected} onClose={() => setSelected(null)} onRefresh={refresh} />}
      {showCriar && (
        <CriarAparelhoModal onClose={() => setShowCriar(false)} onRefresh={refresh} />
      )}
    </div>
  )
}
