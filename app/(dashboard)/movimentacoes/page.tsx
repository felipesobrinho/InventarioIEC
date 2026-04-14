'use client'

import { useState, useEffect, useCallback } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/tables/data-table'
import { PageHeader } from '@/components/layout/page-header'
import { MovimentacaoModal } from '@/components/modals/movimentacao-modal'
import { Search } from 'lucide-react'
import { formatDate, mapTipoDispositivo, mapTipoMovimentacao } from '@/lib/utils'
import type { Movimentacao, PaginatedResponse } from '@/types'

const columns: ColumnDef<Movimentacao>[] = [
  { accessorKey: 'data_movimentacao', header: 'Data', cell: ({ getValue }) => formatDate(getValue() as string) },
  { accessorKey: 'identificador_dispositivo', header: 'Identificador', cell: ({ getValue }) => <span className="font-medium font-mono text-xs">{getValue() as string || '—'}</span> },
  { accessorKey: 'tipo_dispositivo', header: 'Dispositivo', cell: ({ getValue }) => mapTipoDispositivo(getValue() as number) },
  { accessorKey: 'tipo_movimentacao', header: 'Movimentação', cell: ({ getValue }) => mapTipoMovimentacao(getValue() as number) },
  { accessorKey: 'setor', header: 'Setor', cell: ({ getValue }) => getValue() || '—' },
  { accessorKey: 'tecnico_responsavel', header: 'Técnico', cell: ({ getValue }) => getValue() || '—' },
]

export default function MovimentacoesPage() {
  const [data, setData] = useState<Movimentacao[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Movimentacao | null>(null)
  const [search, setSearch] = useState('')
  const [tipoDispositivo, setTipoDispositivo] = useState('')
  const [tipoMovimentacao, setTipoMovimentacao] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  function refresh() { setRefreshKey(k => k + 1) }

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    if (tipoDispositivo) params.set('tipo_dispositivo', tipoDispositivo)
    if (tipoMovimentacao) params.set('tipo_movimentacao', tipoMovimentacao)
    if (dataInicio) params.set('data_inicio', dataInicio)
    if (dataFim) params.set('data_fim', dataFim)
    const res = await fetch(`/api/movimentacoes?${params}`)
    const json: PaginatedResponse<Movimentacao> = await res.json()
    setData(json.data); setTotal(json.total); setTotalPages(json.totalPages)
    setLoading(false)
  }, [page, search, tipoDispositivo, tipoMovimentacao, dataInicio, dataFim])

  useEffect(() => { fetchData() }, [fetchData, refreshKey])

  const inputCls = "px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"

  const filters = (
    <>
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Buscar identificador..."
          className={`w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500`} />
      </div>
      <select value={tipoDispositivo} onChange={(e) => { setTipoDispositivo(e.target.value); setPage(1) }} className={inputCls}>
        <option value="">Todos os dispositivos</option>
        <option value="1">Máquina</option>
        <option value="2">Notebook</option>
        <option value="3">Aparelho</option>
        <option value="4">Impressora</option>
        <option value="5">Ramal</option>
        <option value="6">Rack</option>
      </select>
      <select value={tipoMovimentacao} onChange={(e) => { setTipoMovimentacao(e.target.value); setPage(1) }} className={inputCls}>
        <option value="">Todos os tipos</option>
        <option value="1">Entrada</option>
        <option value="2">Saída</option>
        <option value="3">Transferência</option>
        <option value="4">Manutenção</option>
        <option value="5">Empréstimo</option>
        <option value="6">Devolução</option>
      </select>
      <div className="flex items-center gap-2">
        <input type="date" value={dataInicio} onChange={(e) => { setDataInicio(e.target.value); setPage(1) }} className={inputCls} />
        <span className="text-slate-400 text-sm">até</span>
        <input type="date" value={dataFim} onChange={(e) => { setDataFim(e.target.value); setPage(1) }} className={inputCls} />
      </div>
    </>
  )

  return (
    <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">
      <PageHeader title="Movimentações" total={total} />
      <DataTable columns={columns} data={data} total={total} page={page} totalPages={totalPages}
        onPageChange={setPage} onRowClick={setSelected} isLoading={loading} filters={filters} />
      {selected && <MovimentacaoModal movimentacao={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
