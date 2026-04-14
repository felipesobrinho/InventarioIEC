'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/tables/data-table'
import { PageHeader } from '@/components/layout/page-header'
import { StatusSolicitacaoBadge, PrioridadeBadge } from '@/components/dashboard/status-badge'
import { SolicitacaoModal } from '@/components/modals/solicitacao-modal'
import { formatDate, mapTipoSolicitacao, mapTipoDispositivo } from '@/lib/utils'
import type { Solicitacao, PaginatedResponse } from '@/types'

const columns: ColumnDef<Solicitacao, unknown>[] = [
  {
    accessorKey: 'data_criacao',
    header: 'Data',
    cell: ({ row }) => formatDate(row.original.data_criacao),
  },
  {
    accessorKey: 'colaborador_relacionado',
    header: 'Colaborador',
    cell: ({ row }) => row.original.colaborador_relacionado || '—',
  },
  {
    accessorKey: 'tipo_solicitacao',
    header: 'Tipo',
    cell: ({ row }) => mapTipoSolicitacao(row.original.tipo_solicitacao),
  },
  {
    accessorKey: 'tipo_dispositivo',
    header: 'Dispositivo',
    cell: ({ row }) => mapTipoDispositivo(row.original.tipo_dispositivo),
  },
  {
    accessorKey: 'prioridade',
    header: 'Prioridade',
    cell: ({ row }) => <PrioridadeBadge prioridade={row.original.prioridade} />,
  },
  {
    accessorKey: 'status_solicitacao',
    header: 'Status',
    cell: ({ row }) => <StatusSolicitacaoBadge status={row.original.status_solicitacao} />,
  },
  {
    accessorKey: 'solicitante',
    header: 'Solicitante',
    cell: ({ row }) => row.original.solicitante || '—',
  },
]

export default function SolicitacoesPage() {
  const searchParams = useSearchParams()
  const [data, setData] = useState<Solicitacao[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Solicitacao | null>(null)
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [prioridade, setPrioridade] = useState('')
  const [tipoSolicitacao, setTipoSolicitacao] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  function refresh() { setRefreshKey(k => k + 1) }

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (status) params.set('status', status)
    if (prioridade) params.set('prioridade', prioridade)
    if (tipoSolicitacao) params.set('tipo_solicitacao', tipoSolicitacao)
    if (dataInicio) params.set('data_inicio', dataInicio)
    if (dataFim) params.set('data_fim', dataFim)
    const res = await fetch(`/api/solicitacoes?${params}`)
    const json: PaginatedResponse<Solicitacao> = await res.json()
    setData(json.data)
    setTotal(json.total)
    setTotalPages(json.totalPages)
    setLoading(false)
  }, [page, status, prioridade, tipoSolicitacao, dataInicio, dataFim])

  useEffect(() => { fetchData() }, [fetchData, refreshKey])

  const inputCls = "px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"

  const filters = (
    <>
      <select value={tipoSolicitacao} onChange={(e) => { setTipoSolicitacao(e.target.value); setPage(1) }} className={inputCls}>
        <option value="">Todos os tipos</option>
        <option value="1">Suporte</option>
        <option value="2">Instalação</option>
        <option value="3">Troca</option>
        <option value="4">Configuração</option>
        <option value="5">Manutenção</option>
        <option value="6">Novo ativo</option>
      </select>
      <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className={inputCls}>
        <option value="">Todos os status</option>
        <option value="1">Aberto</option>
        <option value="2">Em andamento</option>
        <option value="3">Pendente</option>
        <option value="4">Concluído</option>
        <option value="5">Cancelado</option>
      </select>
      <select value={prioridade} onChange={(e) => { setPrioridade(e.target.value); setPage(1) }} className={inputCls}>
        <option value="">Todas as prioridades</option>
        <option value="1">Baixa</option>
        <option value="2">Média</option>
        <option value="3">Alta</option>
        <option value="4">Crítica</option>
        <option value="5">Urgente</option>
      </select>
      <div className="flex items-center gap-2">
        <input type="date" value={dataInicio} onChange={(e) => { setDataInicio(e.target.value); setPage(1) }} className={inputCls} title="Data início" />
        <span className="text-slate-400 text-sm">até</span>
        <input type="date" value={dataFim} onChange={(e) => { setDataFim(e.target.value); setPage(1) }} className={inputCls} title="Data fim" />
      </div>
    </>
  )

  return (
    <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">
      <PageHeader title="Solicitações" total={total} />
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
      {selected && (
        <SolicitacaoModal
          solicitacao={selected}
          onClose={() => setSelected(null)}
          onRefresh={fetchData}
        />
      )}
    </div>
  )
}