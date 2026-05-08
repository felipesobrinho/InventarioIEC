'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/tables/data-table'
import { PageHeader } from '@/components/layout/page-header'
import { RackModal } from '@/components/modals/rack-modal'
import { CriarRackModal } from '@/components/modals/criar-rack-modal'
import { SetorSelect } from '@/components/modals/setor-select'
import { Search, Plus } from 'lucide-react'
import type { Rack, PaginatedResponse } from '@/types'

export default function RacksPage() {
  const searchParams = useSearchParams()
  const inspectId = searchParams.get('inspect')

  const [data, setData]         = useState<Rack[]>([])
  const [total, setTotal]       = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<Rack | null>(null)
  const [showCriar, setShowCriar] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const [search, setSearch]             = useState('')
  const [setorIdFiltro, setSetorIdFiltro] = useState<string | null>(searchParams.get('setor_id'))
  const [sort, setSort]                 = useState('nome_switch')
  const [dir, setDir]                   = useState<'asc' | 'desc'>('asc')

  const cancelledRef = useRef(false)
  function refresh() { setRefreshKey(k => k + 1) }

  const columns = useMemo<ColumnDef<Rack, unknown>[]>(() => [
    {
      accessorKey: 'nome_switch',
      header: 'Switch',
      cell: ({ row }) => (
        <div>
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {row.original.nome_switch || '—'}
          </span>
          <p className="text-xs text-slate-400">{row.original.marca_switch || ''}</p>
        </div>
      ),
    },
    {
      accessorKey: 'setor_nome',
      header: 'Setor / Localidade',
      cell: ({ row }) => row.original.setor_nome ?? row.original.localizacao ?? '—',
    },
    {
      accessorKey: 'numero_patrimonio',
      header: 'Patrimônio',
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.numero_patrimonio || '—'}</span>
      ),
    },
    {
      id: 'portas',
      header: 'Portas',
      cell: ({ row }) => {
        const total = row.original.quantidade_portas
        const emUso = row.original.portas_em_uso
        const livres = row.original.portas_livres

        if (total == null) return '—'
        return (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {total} total
            </span>
            {emUso != null && (
              <>
                <span className="text-red-500 text-xs font-medium">{emUso} em uso</span>
                <span className="text-green-600 dark:text-green-400 text-xs font-medium">
                  {livres} livres
                </span>
              </>
            )}
          </div>
        )
      },
    },
  ], [])

  useEffect(() => {
    cancelledRef.current = false
    setLoading(true)

    async function fetchData() {
      const params = new URLSearchParams({ page: String(page), limit: '20', sort, dir })
      if (search)       params.set('search',   search)
      if (setorIdFiltro) params.set('setor_id', setorIdFiltro)

      try {
        const res = await fetch(`/api/racks?${params}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: PaginatedResponse<Rack> = await res.json()
        if (!cancelledRef.current) {
          setData(json.data)
          setTotal(json.total)
          setTotalPages(json.totalPages)
        }
      } catch (err) {
        console.error('[racks page]', err)
      } finally {
        if (!cancelledRef.current) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelledRef.current = true }
  }, [page, search, setorIdFiltro, sort, dir, refreshKey])

  useEffect(() => {
    if (!inspectId) return
    fetch(`/api/racks/${inspectId}`)
      .then(r => r.ok ? r.json() : null)
      .then(item => { if (item) setSelected(item) })
      .catch(() => {})
  }, [inspectId])

  const inputCls = "px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"

  const filters = (
    <>
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Switch, marca, patrimônio..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <SetorSelect
        value={setorIdFiltro}
        onChange={(id) => { setSetorIdFiltro(id); setPage(1) }}
        placeholder="Filtrar por setor..."
        allowCreate={false}
      />
      <select value={`${sort}:${dir}`} onChange={(e) => {
        const [s, d] = e.target.value.split(':')
        setSort(s); setDir(d as 'asc' | 'desc'); setPage(1)
      }} className={inputCls}>
        <option value="nome_switch:asc">Nome A→Z</option>
        <option value="nome_switch:desc">Nome Z→A</option>
        <option value="created_at:desc">Mais recentes</option>
        <option value="created_at:asc">Mais antigos</option>
      </select>
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

      <DataTable columns={columns} data={data} total={total} page={page}
        totalPages={totalPages} onPageChange={setPage} onRowClick={setSelected}
        isLoading={loading} filters={filters} />

      {selected && <RackModal rack={selected} onClose={() => setSelected(null)} onRefresh={refresh} />}
      {showCriar && <CriarRackModal onClose={() => setShowCriar(false)} onRefresh={refresh} />}
    </div>
  )
}
