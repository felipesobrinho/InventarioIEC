'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/tables/data-table'
import { PageHeader } from '@/components/layout/page-header'
import { BoolBadge } from '@/components/dashboard/status-badge'
import { RamalModal } from '@/components/modals/ramal-modal'
import { CriarRamalModal } from '@/components/modals/criar-ramal-modal'
import { silentApiRequest } from '@/lib/api-fetch'
import { Search, Plus } from 'lucide-react'
import type { Ramal, PaginatedResponse } from '@/types'

export default function RamaisPage() {
  const searchParams = useSearchParams()
  const inspectId = searchParams.get('inspect')

  const [data, setData] = useState<Ramal[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Ramal | null>(null)
  const [showCriar, setShowCriar] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const [search, setSearch] = useState('')
  const [disponibilidade, setDisponibilidade] = useState('')
  const [fila, setFila] = useState('')
  const [alocacao, setAlocacao] = useState('')
  const [sort, setSort] = useState('numero_ramal')
  const [dir, setDir] = useState<'asc' | 'desc'>('asc')
  const [whatsappFiltro, setWhatsappFiltro] = useState('')

  const cancelledRef = useRef(false)

  function refresh() { setRefreshKey(k => k + 1) }

  // Colunas dentro do componente para evitar bug do Turbopack com JSX fora do componente
  const columns = useMemo<ColumnDef<Ramal, unknown>[]>(() => [
    {
      accessorKey: 'numero_ramal',
      header: 'Ramal',
      cell: ({ row }) => (
        <span className="font-medium font-mono">
          {row.original.numero_ramal != null ? String(row.original.numero_ramal) : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'nome_setor',
      header: 'Setor',
      cell: ({ row }) => row.original.nome_setor || '—',
    },
    {
      accessorKey: 'prefixo_telefonico',
      header: 'Prefixo',
      cell: ({ row }) => row.original.prefixo_telefonico || '—',
    },
    {
      accessorKey: 'fila',
      header: 'Fila',
      cell: ({ row }) => <BoolBadge value={row.original.fila} />,
    },
    {
      accessorKey: 'contemplacao',
      header: 'Contemplação',
      cell: ({ row }) => <BoolBadge value={row.original.contemplacao} />,
    },
    {
      accessorKey: 'ultima_revisao',
      header: 'Última Revisão',
      cell: ({ row }) => {
        const d = row.original.ultima_revisao
        if (!d) return <span className="text-slate-400 text-xs">Nunca editado</span>
        const date = new Date(d)
        return (
          <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {date.toLocaleDateString('pt-BR')}{' '}
            {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )
      },
    },
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
  ], [])

  useEffect(() => {
    cancelledRef.current = false
    setLoading(true)

    async function fetchData() {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        sort,
        dir,
      })
      if (search)        params.set('search',        search)
      if (disponibilidade) params.set('disponibilidade', disponibilidade)
      if (fila !== '')   params.set('fila',          fila)
      if (alocacao)      params.set('alocacao',      alocacao)
      if (whatsappFiltro) params.set('whatsapp', whatsappFiltro)

      try {
        const res = await fetch(`/api/ramais?${params}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: PaginatedResponse<Ramal> = await res.json()
        if (!cancelledRef.current) {
          setData(json.data)
          setTotal(json.total)
          setTotalPages(json.totalPages)
        }
      } catch (err) {
        console.error('[ramais page]', err)
      } finally {
        if (!cancelledRef.current) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelledRef.current = true }
  }, [page, search, disponibilidade, fila, alocacao, sort, dir, whatsappFiltro, refreshKey])

  // Abrir modal via ?inspect=id (vindo do colaborador)
  useEffect(() => {
    if (!inspectId) return
    // Buscar diretamente pelo ID — correto: /api/ramais/[id]
    fetch(`/api/ramais/${inspectId}`, silentApiRequest)
      .then(r => r.ok ? r.json() : null)
      .then(item => { if (item) setSelected(item) })
      .catch(() => {})
  }, [inspectId])

  const inputCls = "px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"

  const filters = (
    <>
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Ramal, setor ou colaborador..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <input
        value={disponibilidade}
        onChange={(e) => { setDisponibilidade(e.target.value); setPage(1) }}
        placeholder="Disponibilidade..."
        className={`${inputCls} w-40`}
      />

      <select
        value={fila}
        onChange={(e) => { setFila(e.target.value); setPage(1) }}
        className={inputCls}
      >
        <option value="">Com/sem fila</option>
        <option value="true">Com fila</option>
        <option value="false">Sem fila</option>
      </select>

      <select
        value={alocacao}
        onChange={(e) => { setAlocacao(e.target.value); setPage(1) }}
        className={inputCls}
      >
        <option value="">Todos</option>
        <option value="alocado">Alocados</option>
        <option value="livre">Disponíveis</option>
      </select>

      <select
        value={whatsappFiltro}
        onChange={(e) => { setWhatsappFiltro(e.target.value); setPage(1) }}
        className={inputCls}
      >
        <option value="">Com/sem WhatsApp</option>
        <option value="true">Com WhatsApp</option>
      </select>

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
        <option value="numero_ramal:asc">Ramal ↑</option>
        <option value="numero_ramal:desc">Ramal ↓</option>
        <option value="created_at:desc">Mais recentes</option>
        <option value="created_at:asc">Mais antigos</option>
        <option value="nome_setor:asc">Setor A→Z</option>
      </select>
    </>
  )

  return (
    <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">
      <PageHeader title="Ramais" total={total}>
        <button
          type="button"
          onClick={() => setShowCriar(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
        >
          <Plus className="w-4 h-4" /> Novo ramal
        </button>
      </PageHeader>

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

      {showCriar && (
        <CriarRamalModal onClose={() => setShowCriar(false)} onRefresh={refresh} />
      )}
      {selected && (
        <RamalModal
          ramal={selected}
          onClose={() => setSelected(null)}
          onRefresh={refresh}
        />
      )}
    </div>
  )
}
