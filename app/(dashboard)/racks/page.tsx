import React from 'react'
'use client'

import { useState, useEffect, useCallback } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/tables/data-table'
import { PageHeader } from '@/components/layout/page-header'
import { RackModal } from '@/components/modals/rack-modal'
import { Search } from 'lucide-react'
import type { Rack, PaginatedResponse } from '@/types'

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

export default function RacksPage() {
  const [data, setData] = useState<Rack[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Rack | null>(null)
  const [search, setSearch] = useState('')
  const [marca, setMarca] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
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

  useEffect(() => { fetchData() }, [fetchData, refreshKey])

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
      <PageHeader title="Racks" total={total} />
      <DataTable columns={columns} data={data} total={total} page={page} totalPages={totalPages}
        onPageChange={setPage} onRowClick={setSelected} isLoading={loading} filters={filters} />
      {selected && <RackModal rack={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
