'use client'

import { useState, useEffect, useCallback } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/tables/data-table'
import { PageHeader } from '@/components/layout/page-header'
import { BoolBadge } from '@/components/dashboard/status-badge'
import { ImpressoraModal } from '@/components/modals/impressora-modal'
import { Search } from 'lucide-react'
import type { Impressora, PaginatedResponse } from '@/types'

const columns: ColumnDef<Impressora>[] = [
  { accessorKey: 'nome_host', header: 'Nome Host', cell: ({ getValue }) => <span className="font-medium">{getValue() as string || '—'}</span> },
  { accessorKey: 'fabricante', header: 'Fabricante', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'modelo', header: 'Modelo', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'numero_serie', header: 'Nº Série', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'endereco_ip', header: 'IP', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'localidade', header: 'Localidade', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'andar', header: 'Andar', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => <BoolBadge value={getValue() as boolean} labelTrue="Ativo" labelFalse="Inativo" /> },
]

export default function ImpressorasPage() {
  const [data, setData] = useState<Impressora[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Impressora | null>(null)
  const [search, setSearch] = useState('')
  const [localidade, setLocalidade] = useState('')
  const [andar, setAndar] = useState('')
  const [status, setStatus] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    if (localidade) params.set('localidade', localidade)
    if (andar) params.set('andar', andar)
    if (status !== '') params.set('status', status)
    const res = await fetch(`/api/impressoras?${params}`)
    const json: PaginatedResponse<Impressora> = await res.json()
    setData(json.data); setTotal(json.total); setTotalPages(json.totalPages)
    setLoading(false)
  }, [page, search, localidade, andar, status])

  useEffect(() => { fetchData() }, [fetchData])

  const filters = (
    <>
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Buscar por nome host ou nº série..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <input value={localidade} onChange={(e) => { setLocalidade(e.target.value); setPage(1) }} placeholder="Localidade..."
        className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-36" />
      <input value={andar} onChange={(e) => { setAndar(e.target.value); setPage(1) }} placeholder="Andar..."
        className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-28" />
      <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}
        className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">Todos os status</option>
        <option value="true">Ativo</option>
        <option value="false">Inativo</option>
      </select>
    </>
  )

  return (
    <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">
      <PageHeader title="Impressoras" total={total} />
      <DataTable columns={columns} data={data} total={total} page={page} totalPages={totalPages}
        onPageChange={setPage} onRowClick={setSelected} isLoading={loading} filters={filters} />
      {selected && <ImpressoraModal impressora={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
