'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/tables/data-table'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { ColaboradorModal } from '@/components/modals/colaborador-modal'
import { Search, SlidersHorizontal } from 'lucide-react'
import type { Colaborador, PaginatedResponse } from '@/types'

const columns: ColumnDef<Colaborador>[] = [
  { accessorKey: 'codigo', header: 'Código', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'nome', header: 'Nome', cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span> },
  { accessorKey: 'setor', header: 'Setor', cell: ({ getValue }) => getValue() || '—' },
  {
    accessorKey: 'status', header: 'Status',
    cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
  },
]

export default function ColaboradoresPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [data, setData] = useState<Colaborador[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Colaborador | null>(null)

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [setor, setSetor] = useState(searchParams.get('setor') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    if (setor) params.set('setor', setor)
    if (status) params.set('status', status)
    const res = await fetch(`/api/colaboradores?${params}`)
    const json: PaginatedResponse<Colaborador> = await res.json()
    setData(json.data)
    setTotal(json.total)
    setTotalPages(json.totalPages)
    setLoading(false)
  }, [page, search, setor, status])

  useEffect(() => { fetchData() }, [fetchData])

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
      <input
        value={setor}
        onChange={(e) => { setSetor(e.target.value); setPage(1) }}
        placeholder="Filtrar por setor..."
        className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
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
      <PageHeader title="Colaboradores" total={total} />
      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onRowClick={setSelected}
        isLoading={loading}
        filters={filters}
      />
      {selected && <ColaboradorModal colaborador={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
