'use client'

import { useState, useEffect, useCallback } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/tables/data-table'
import { PageHeader } from '@/components/layout/page-header'
import { CategoriaBadge } from '@/components/dashboard/status-badge'
import { MaquinaModal } from '@/components/modals/maquina-modal'
import { Search } from 'lucide-react'
import type { Maquina, PaginatedResponse } from '@/types'

const columns: ColumnDef<Maquina>[] = [
  { accessorKey: 'nome_host', header: 'Nome Host', cell: ({ getValue }) => <span className="font-medium">{getValue() as string || '—'}</span> },
  { accessorKey: 'identificador', header: 'Identificador', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'fabricante', header: 'Fabricante', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'modelo', header: 'Modelo', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'categoria', header: 'Categoria', cell: ({ getValue }) => <CategoriaBadge categoria={getValue() as string} /> },
  { accessorKey: 'setor', header: 'Setor', cell: ({ getValue }) => getValue() || '—' },
  {
    id: 'alocado',
    header: 'Alocado a',
    cell: ({ row }) => row.original.alocacao_ativa
      ? <span className="text-green-600 dark:text-green-400 text-xs font-medium">{row.original.alocacao_ativa.colaborador.nome}</span>
      : <span className="text-slate-400 text-xs">Livre</span>,
  },
]

export default function MaquinasPage() {
  const [data, setData] = useState<Maquina[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Maquina | null>(null)
  const [search, setSearch] = useState('')
  const [setor, setSetor] = useState('')
  const [categoria, setCategoria] = useState('')
  const [fabricante, setFabricante] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  function refresh() { setRefreshKey(k => k + 1) }

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    if (setor) params.set('setor', setor)
    if (categoria) params.set('categoria', categoria)
    if (fabricante) params.set('fabricante', fabricante)
    const res = await fetch(`/api/maquinas?${params}`)
    const json: PaginatedResponse<Maquina> = await res.json()
    setData(json.data); setTotal(json.total); setTotalPages(json.totalPages)
    setLoading(false)
  }, [page, search, setor, categoria, fabricante])

  useEffect(() => { fetchData() }, [fetchData, refreshKey])

  const filters = (
    <>
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Buscar por nome host ou identificador..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <input value={setor} onChange={(e) => { setSetor(e.target.value); setPage(1) }}
        placeholder="Setor..." className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-36" />
      <input value={fabricante} onChange={(e) => { setFabricante(e.target.value); setPage(1) }}
        placeholder="Fabricante..." className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-36" />
      <select value={categoria} onChange={(e) => { setCategoria(e.target.value); setPage(1) }}
        className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">Todas as categorias</option>
        <option value="Administrativa">Administrativa</option>
        <option value="Academica">Acadêmica</option>
      </select>
    </>
  )

  return (
    <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">
      <PageHeader title="Máquinas" total={total} />
      <DataTable columns={columns} data={data} total={total} page={page} totalPages={totalPages}
        onPageChange={setPage} onRowClick={setSelected} isLoading={loading} filters={filters} />
      {selected && <MaquinaModal maquina={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
