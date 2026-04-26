'use client'

import { useState, useEffect } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/tables/data-table'
import { PageHeader } from '@/components/layout/page-header'
import { CategoriaBadge } from '@/components/dashboard/status-badge'
import { NotebookModal } from '@/components/modals/notebook-modal'
import { Search } from 'lucide-react'
import type { Notebook, PaginatedResponse } from '@/types'
import { CriarNotebookModal } from '@/components/modals/criar-notebook-modal'
import { Plus } from 'lucide-react'

const columns: ColumnDef<Notebook>[] = [
  { accessorKey: 'modelo', header: 'Modelo', cell: ({ getValue }) => <span className="font-medium">{getValue() as string || '—'}</span> },
  { accessorKey: 'fabricante', header: 'Fabricante', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'numero_patrimonio', header: 'Patrimônio', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'categoria', header: 'Categoria', cell: ({ getValue }) => <CategoriaBadge categoria={getValue() as string} /> },
  { accessorKey: 'setor', header: 'Setor', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'memoria', header: 'Memória', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'armazenamento', header: 'Armazenamento', cell: ({ getValue }) => getValue() || '—' },
  {
    id: 'alocado',
    header: 'Alocado a',
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

export default function NotebooksPage() {
  const [data, setData] = useState<Notebook[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Notebook | null>(null)
  const [showCriar, setShowCriar] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Filtros
  const [search, setSearch] = useState('')
  const [setor, setSetor] = useState('')
  const [categoria, setCategoria] = useState('')
  const [fabricante, setFabricante] = useState('')
  const [alocacao, setAlocacao] = useState('')   // 'alocado' | 'livre' | ''
  const [sort, setSort] = useState('modelo')
  const [dir, setDir] = useState<'asc' | 'desc'>('asc')

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
      if (setor)     params.set('setor',     setor)
      if (categoria) params.set('categoria', categoria)
      if (fabricante)params.set('fabricante',fabricante)
      if (alocacao)  params.set('alocacao',  alocacao)

      try {
        const res = await fetch(`/api/notebooks?${params}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: PaginatedResponse<Notebook> = await res.json()
        if (!cancelled) {
          setData(json.data)
          setTotal(json.total)
          setTotalPages(json.totalPages)
        }
      } catch (err) {
        console.error('[notebooks page]', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [page, search, setor, categoria, fabricante, alocacao, sort, dir, refreshKey])

  const inputCls = "px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"

  const filters = (
    <>
      {/* Busca */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Modelo, patrimônio ou colaborador..."
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
        <option value="fabricante:asc">Fabricante A→Z</option>
        <option value="setor:asc">Setor A→Z</option>
      </select>
    </>
  )

  return (
    <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">
      <PageHeader title="Notebooks" total={total}>
        <button type="button" onClick={() => setShowCriar(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition">
          <Plus className="w-4 h-4" /> Novo notebook
        </button>
      </PageHeader>
      <DataTable columns={columns} data={data} total={total} page={page} totalPages={totalPages}
        onPageChange={setPage} onRowClick={setSelected} isLoading={loading} filters={filters} />
      {selected && <NotebookModal notebook={selected} onClose={() => setSelected(null)} onRefresh={fetchData} />}
      {showCriar && <CriarNotebookModal onClose={() => setShowCriar(false)} onRefresh={fetchData} />}
    </div>
  )
}
