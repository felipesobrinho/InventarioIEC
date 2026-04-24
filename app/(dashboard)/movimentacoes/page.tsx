'use client'

import { useState, useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/tables/data-table'
import { PageHeader } from '@/components/layout/page-header'
import { AuditLogModal } from '@/components/modals/audit-log-modal'
import { useFetchData } from '@/hooks/use-fetch-data'
import { Search } from 'lucide-react'

export interface AuditLog {
  id: string
  tabela: string
  registro_id: string
  acao: string
  descricao: string | null
  dados_anteriores: any
  dados_novos: any
  usuario_id: string | null
  usuario_nome: string | null
  created_at: string | null
}

export const ACAO_COLORS: Record<string, string> = {
  CREATE:          'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  UPDATE:          'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  DELETE:          'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  ALOCAR:          'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  DESALOCAR:       'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  EDITAR_ALOCACAO: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
}

export const ACAO_LABELS: Record<string, string> = {
  CREATE:          'Criação',
  UPDATE:          'Edição',
  DELETE:          'Exclusão',
  ALOCAR:          'Alocação',
  DESALOCAR:       'Desalocação',
  EDITAR_ALOCACAO: 'Edição de Alocação',
}

export const TABELAS_OPCOES = [
  { value: 'maquinas',            label: 'Máquinas' },
  { value: 'notebooks',           label: 'Notebooks' },
  { value: 'aparelhos',           label: 'Aparelhos' },
  { value: 'impressoras',         label: 'Impressoras' },
  { value: 'ramais',              label: 'Ramais' },
  { value: 'racks',               label: 'Racks' },
  { value: 'colaboradores',       label: 'Colaboradores' },
  { value: 'solicitacoes',        label: 'Solicitações' },
  { value: 'movimentacoes',       label: 'Movimentações' },
  { value: 'alocacoes_maquinas',  label: 'Alocações — Máquinas' },
  { value: 'alocacoes_notebooks', label: 'Alocações — Notebooks' },
  { value: 'alocacoes_aparelhos', label: 'Alocações — Aparelhos' },
  { value: 'alocacoes_ramais',    label: 'Alocações — Ramais' },
]

function AcaoBadge({ acao }: { acao: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap ${ACAO_COLORS[acao] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
      {ACAO_LABELS[acao] || acao}
    </span>
  )
}

export default function MovimentacoesPage() {
  const [page, setPage] = useState(1)
  const [refreshKey] = useState(0)
  const [selected, setSelected] = useState<AuditLog | null>(null)
  const [tabela, setTabela] = useState('')
  const [acao, setAcao] = useState('')
  const [usuario, setUsuario] = useState('')

  const { data, total, totalPages, loading } = useFetchData<AuditLog>(
    'audit-log',
    { tabela, acao, usuario },
    page,
    refreshKey
  )

  const columns = useMemo<ColumnDef<AuditLog, unknown>[]>(() => [
    {
      accessorKey: 'created_at',
      header: 'Data/Hora',
      cell: ({ row }) => {
        const d = row.original.created_at
        if (!d) return '—'
        const date = new Date(d)
        return (
          <span className="text-xs font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
            {date.toLocaleDateString('pt-BR')}{' '}
            {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )
      },
    },
    {
      accessorKey: 'acao',
      header: 'Ação',
      cell: ({ row }) => <AcaoBadge acao={row.original.acao} />,
    },
    {
      accessorKey: 'tabela',
      header: 'Módulo',
      cell: ({ row }) => {
        const label = TABELAS_OPCOES.find(t => t.value === row.original.tabela)?.label
          || row.original.tabela
        return <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
      },
    },
    {
      accessorKey: 'descricao',
      header: 'Descrição',
      cell: ({ row }) => (
        <span className="text-sm text-slate-700 dark:text-slate-300 max-w-xs truncate block">
          {row.original.descricao || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'usuario_nome',
      header: 'Responsável',
      cell: ({ row }) => (
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
          {row.original.usuario_nome || '—'}
        </span>
      ),
    },
  ], [])

  const inputCls = "px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"

  const filters = (
    <>
      <select
        value={tabela}
        onChange={(e) => { setTabela(e.target.value); setPage(1) }}
        className={inputCls}
      >
        <option value="">Todos os módulos</option>
        {TABELAS_OPCOES.map(t => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

      <select
        value={acao}
        onChange={(e) => { setAcao(e.target.value); setPage(1) }}
        className={inputCls}
      >
        <option value="">Todas as ações</option>
        <option value="CREATE">Criação</option>
        <option value="UPDATE">Edição</option>
        <option value="DELETE">Exclusão</option>
        <option value="ALOCAR">Alocação</option>
        <option value="DESALOCAR">Desalocação</option>
        <option value="EDITAR_ALOCACAO">Edição de Alocação</option>
      </select>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={usuario}
          onChange={(e) => { setUsuario(e.target.value); setPage(1) }}
          placeholder="Filtrar por responsável..."
          className="pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
        />
      </div>
    </>
  )

  return (
    <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">
      <PageHeader
        title="Log de Auditoria"
        description="Registro de todas as alterações realizadas no sistema"
        total={total}
      />

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
        <AuditLogModal
          log={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}