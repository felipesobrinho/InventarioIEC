'use client'

import { useState, useEffect, useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/tables/data-table'
import { PageHeader } from '@/components/layout/page-header'
import { CategoriaBadge } from '@/components/dashboard/status-badge'
import { MaquinaModal } from '@/components/modals/maquina-modal'
import { CriarMaquinaModal } from '@/components/modals/criar-maquina-modal'
import { Search, Plus } from 'lucide-react'
import type { Maquina, PaginatedResponse } from '@/types'

export default function MaquinasPage() {
  const [data, setData] = useState<Maquina[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Maquina | null>(null)
  const [showCriar, setShowCriar] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Filtros
  const [search, setSearch] = useState('')
  const [setor, setSetor] = useState('')
  const [categoria, setCategoria] = useState('')
  const [fabricante, setFabricante] = useState('')
  const [alocacao, setAlocacao] = useState('')   // 'alocado' | 'livre' | ''
  const [sort, setSort] = useState('nome_host')
  const [dir, setDir] = useState<'asc' | 'desc'>('asc')

  function refresh() { setRefreshKey(k => k + 1) }

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function fetchData() {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        sort,
        dir,
      })
      if (search)    params.set('search',    search)
      if (setor)     params.set('setor',     setor)
      if (categoria) params.set('categoria', categoria)
      if (fabricante)params.set('fabricante',fabricante)
      if (alocacao)  params.set('alocacao',  alocacao)

      try {
        const res = await fetch(`/api/maquinas?${params}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: PaginatedResponse<Maquina> = await res.json()
        if (!cancelled) {
          setData(json.data)
          setTotal(json.total)
          setTotalPages(json.totalPages)
        }
      } catch (err) {
        console.error('[maquinas page]', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [page, search, setor, categoria, fabricante, alocacao, sort, dir, refreshKey])

  const columns = useMemo<ColumnDef<Maquina, unknown>[]>(() => [
    {
      accessorKey: 'nome_host',
      header: 'Nome Host',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.nome_host || '—'}</span>
      ),
    },
    {
      accessorKey: 'identificador',
      header: 'Identificador',
      cell: ({ row }) => row.original.identificador || '—',
    },
    {
      accessorKey: 'fabricante',
      header: 'Fabricante',
      cell: ({ row }) => row.original.fabricante || '—',
    },
    {
      accessorKey: 'modelo',
      header: 'Modelo',
      cell: ({ row }) => row.original.modelo || '—',
    },
    {
      accessorKey: 'categoria',
      header: 'Categoria',
      cell: ({ row }) => <CategoriaBadge categoria={row.original.categoria} />,
    },
    {
      accessorKey: 'setor',
      header: 'Setor',
      cell: ({ row }) => row.original.setor || '—',
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

  const inputCls = "px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"

  const filters = (
    <>
      {/* Busca */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Nome, identificador ou colaborador..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Setor */}
      <input
        value={setor}
        onChange={(e) => { setSetor(e.target.value); setPage(1) }}
        placeholder="Setor..."
        className={`${inputCls} w-32`}
      />

      {/* Categoria */}
      <select
        value={categoria}
        onChange={(e) => { setCategoria(e.target.value); setPage(1) }}
        className={inputCls}
      >
        <option value="">Todas as categorias</option>
        <option value="Administrativa">Administrativa</option>
        <option value="Academica">Acadêmica</option>
      </select>

      {/* Fabricante */}
      <input
        value={fabricante}
        onChange={(e) => { setFabricante(e.target.value); setPage(1) }}
        placeholder="Fabricante..."
        className={`${inputCls} w-32`}
      />

      {/* Disponibilidade */}
      <select
        value={alocacao}
        onChange={(e) => { setAlocacao(e.target.value); setPage(1) }}
        className={inputCls}
      >
        <option value="">Todos</option>
        <option value="alocado">Alocados</option>
        <option value="livre">Disponíveis</option>
      </select>

      {/* Ordenação */}
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
        <option value="nome_host:asc">Nome A→Z</option>
        <option value="nome_host:desc">Nome Z→A</option>
        <option value="created_at:desc">Mais recentes</option>
        <option value="created_at:asc">Mais antigos</option>
        <option value="fabricante:asc">Fabricante A→Z</option>
      </select>
    </>
  )

  return (
    <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">
      <PageHeader title="Máquinas" total={total}>
        <button
          type="button"
          onClick={() => setShowCriar(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
        >
          <Plus className="w-4 h-4" /> Nova máquina
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

      {selected && (
        <MaquinaModal
          maquina={selected}
          onClose={() => setSelected(null)}
          onRefresh={refresh}
        />
      )}
      {showCriar && (
        <CriarMaquinaModal
          onClose={() => setShowCriar(false)}
          onRefresh={refresh}
        />
      )}
    </div>
  )
}