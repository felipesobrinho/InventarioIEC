'use client'

import { useState, useEffect, useCallback } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/tables/data-table'
import { PageHeader } from '@/components/layout/page-header'
import { BoolBadge } from '@/components/dashboard/status-badge'
import { AparelhoModal } from '@/components/modals/aparelho-modal'
import { Search } from 'lucide-react'
import { mapTipoAparelho } from '@/lib/utils'
import type { Aparelho, PaginatedResponse } from '@/types'

const columns: ColumnDef<Aparelho>[] = [
  { accessorKey: 'modelo', header: 'Modelo', cell: ({ getValue }) => <span className="font-medium">{getValue() as string || '—'}</span> },
  { accessorKey: 'tipo', header: 'Tipo', cell: ({ getValue }) => mapTipoAparelho(getValue() as number) },
  { accessorKey: 'setor', header: 'Setor', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'endereco_ip', header: 'IP', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'chip', header: 'Chip', cell: ({ getValue }) => <BoolBadge value={getValue() as boolean} /> },
  { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => <BoolBadge value={getValue() as boolean} labelTrue="Ativo" labelFalse="Inativo" /> },
  {
    id: 'alocado', header: 'Alocado a',
    cell: ({ row }) => row.original.alocacao_ativa
      ? <span className="text-green-600 dark:text-green-400 text-xs font-medium">{row.original.alocacao_ativa.colaborador.nome}</span>
      : <span className="text-slate-400 text-xs">Livre</span>,
  },
]

export default function AparelhosPage() {
  const [data, setData] = useState<Aparelho[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Aparelho | null>(null)
  const [search, setSearch] = useState('')
  const [setor, setSetor] = useState('')
  const [status, setStatus] = useState('')
  const [chip, setChip] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    if (setor) params.set('setor', setor)
    if (status !== '') params.set('status', status)
    if (chip !== '') params.set('chip', chip)
    const res = await fetch(`/api/aparelhos?${params}`)
    const json: PaginatedResponse<Aparelho> = await res.json()
    setData(json.data); setTotal(json.total); setTotalPages(json.totalPages)
    setLoading(false)
  }, [page, search, setor, status, chip])

  useEffect(() => { fetchData() }, [fetchData])

  const inputCls = "px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"

  const filters = (
    <>
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Buscar por modelo..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <input value={setor} onChange={(e) => { setSetor(e.target.value); setPage(1) }} placeholder="Setor..." className={`${inputCls} w-36`} />
      <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className={inputCls}>
        <option value="">Todos os status</option>
        <option value="true">Ativo</option>
        <option value="false">Inativo</option>
      </select>
      <select value={chip} onChange={(e) => { setChip(e.target.value); setPage(1) }} className={inputCls}>
        <option value="">Com/sem chip</option>
        <option value="true">Com chip</option>
        <option value="false">Sem chip</option>
      </select>
    </>
  )

  return (
    <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">
      <PageHeader title="Aparelhos" total={total} />
      <DataTable columns={columns} data={data} total={total} page={page} totalPages={totalPages}
        onPageChange={setPage} onRowClick={setSelected} isLoading={loading} filters={filters} />
      {selected && <AparelhoModal aparelho={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
