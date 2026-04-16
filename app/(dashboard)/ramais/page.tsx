'use client'

import { useState, useEffect, useCallback } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/tables/data-table'
import { PageHeader } from '@/components/layout/page-header'
import { BoolBadge } from '@/components/dashboard/status-badge'
import { RamalModal } from '@/components/modals/ramal-modal'
import { Search } from 'lucide-react'
import type { Ramal, PaginatedResponse } from '@/types'

const columns: ColumnDef<Ramal>[] = [
  { accessorKey: 'numero_ramal', header: 'Ramal', cell: ({ getValue }) => <span className="font-medium font-mono">{getValue() != null ? String(getValue()) : '—'}</span> },
  { accessorKey: 'nome_setor', header: 'Setor', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'prefixo_telefonico', header: 'Prefixo', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'disponibilidade', header: 'Disponibilidade', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'fila', header: 'Fila', cell: ({ getValue }) => <BoolBadge value={getValue() as boolean} /> },
  { accessorKey: 'contemplacao', header: 'Contemplação', cell: ({ getValue }) => <BoolBadge value={getValue() as boolean} /> },
  {
    id: 'alocado', header: 'Alocado a',
    cell: ({ row }) => row.original.alocacao_ativa
      ? <span className="text-green-600 dark:text-green-400 text-xs font-medium">{row.original.alocacao_ativa.colaborador.nome}</span>
      : <span className="text-slate-400 text-xs">Livre</span>,
  },
]

export default function RamaisPage() {
  const [data, setData] = useState<Ramal[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Ramal | null>(null)
  const [search, setSearch] = useState('')
  const [disponibilidade, setDisponibilidade] = useState('')
  const [fila, setFila] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  function refresh() { setRefreshKey(k => k + 1) }

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    if (disponibilidade) params.set('disponibilidade', disponibilidade)
    if (fila !== '') params.set('fila', fila)
    const res = await fetch(`/api/ramais?${params}`)
    const json: PaginatedResponse<Ramal> = await res.json()
    setData(json.data); setTotal(json.total); setTotalPages(json.totalPages)
    setLoading(false)
  }, [page, search, disponibilidade, fila])

  useEffect(() => { fetchData() }, [fetchData, refreshKey])

  const inputCls = "px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"

  const filters = (
    <>
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Buscar por ramal ou setor..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <input value={disponibilidade} onChange={(e) => { setDisponibilidade(e.target.value); setPage(1) }} placeholder="Disponibilidade..." className={`${inputCls} w-40`} />
      <select value={fila} onChange={(e) => { setFila(e.target.value); setPage(1) }} className={inputCls}>
        <option value="">Com/sem fila</option>
        <option value="true">Com fila</option>
        <option value="false">Sem fila</option>
      </select>
    </>
  )

  return (
    <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">
      <PageHeader title="Ramais" total={total} />
      <DataTable columns={columns} data={data} total={total} page={page} totalPages={totalPages}
        onPageChange={setPage} onRowClick={setSelected} isLoading={loading} filters={filters} />
      {selected && <RamalModal ramal={selected} onClose={() => setSelected(null)} onRefresh={fetchData} />}
    </div>
  )
}
