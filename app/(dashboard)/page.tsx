import { prisma } from '@/lib/prisma'
import { StatsCards } from '@/components/dashboard/stats-cards'
import {
  StatusSolicitacaoBadge,
  PrioridadeBadge,
} from '@/components/dashboard/status-badge'
import {
  formatDate,
  mapTipoDispositivo,
  mapTipoMovimentacao,
  mapTipoSolicitacao,
  mapStatusSolicitacao,
  mapPrioridade,
  STATUS_SOLICITACAO_MAP,
} from '@/lib/utils'
import Link from 'next/link'
import { ClipboardList, ArrowLeftRight, AlertCircle, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'
interface DashboardStats {
  colaboradores: number
  maquinas: number
  notebooks: number
  aparelhos: number
  impressoras: number
  ramais: number
  racks: number
  solicitacoesAbertas: number
  maquinasAlocadas: number    // novo
  notebooksAlocados: number   // novo
  aparelhosAlocados: number   // novo
  ramaisAlocados: number      // novo
}

async function getDashboardData() {
  const [
    colaboradores, maquinas, notebooks, aparelhos,
    impressoras, ramais, racks,
    solicitacoesAbertas,
    maquinasAlocadas, notebooksAlocados, aparelhosAlocados, ramaisAlocados,
    ultimasSolicitacoes, ultimasMovimentacoes, porStatus,
  ] = await Promise.all([
    prisma.colaboradores.count({ where: { status: 'Ativo' } }),
    prisma.maquinas.count(),
    prisma.notebooks.count(),
    prisma.aparelhos.count(),
    prisma.impressoras.count(),
    prisma.ramais.count(),
    prisma.racks.count(),
    prisma.solicitacoes.count({ where: { status_solicitacao: { notIn: [4, 5] } } }),
    prisma.alocacoes_maquinas.count({ where: { ativo: true } }),
    prisma.alocacoes_notebooks.count({ where: { ativo: true } }),
    prisma.alocacoes_aparelhos.count({ where: { ativo: true } }),
    prisma.alocacoes_ramais.count({ where: { ativo: true } }),
    prisma.solicitacoes.findMany({ orderBy: { created_at: 'desc' }, take: 5 }),
    prisma.movimentacoes.findMany({
      orderBy: { created_at: 'desc' }, take: 5,
      include: { colaborador: { select: { nome: true } } },
    }),
    prisma.solicitacoes.groupBy({
      by: ['status_solicitacao'],
      _count: { id: true },
      where: { status_solicitacao: { notIn: [4, 5] } },
      orderBy: { status_solicitacao: 'asc' },
    }),
  ])

  return {
    stats: {
      colaboradores, maquinas, notebooks, aparelhos,
      impressoras, ramais, racks, solicitacoesAbertas,
      maquinasAlocadas, notebooksAlocados, aparelhosAlocados, ramaisAlocados,
    },
    ultimasSolicitacoes,
    ultimasMovimentacoes,
    porStatus,
  }
}

export default async function DashboardPage() {
  const { stats, ultimasSolicitacoes, ultimasMovimentacoes, porStatus } = await getDashboardData()

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-screen-2xl mx-auto">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Visão geral do inventário de TI</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg px-3 py-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          Atualizado agora
        </div>
      </div>

      {/* Stats grid */}
      <StatsCards stats={stats} />

      {/* Middle row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Últimas Solicitações - 2/3 */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                <ClipboardList className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Últimas Solicitações</h2>
            </div>
            <Link href="/solicitacoes" className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
              Ver todas →
            </Link>
          </div>
          <div className="overflow-x-auto flex-1">
            {ultimasSolicitacoes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs">
                Nenhuma solicitação registrada.
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60">
                    <th className="px-4 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Data</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Colaborador</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Tipo</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Prioridade</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimasSolicitacoes.map((s: any) => (
                    <tr key={s.id} className="border-t border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(s.data_criacao)}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap max-w-[150px] truncate">{s.colaborador_relacionado || '—'}</td>
                      <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{mapTipoSolicitacao(s.tipo_solicitacao)}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap"><PrioridadeBadge prioridade={s.prioridade} /></td>
                      <td className="px-4 py-2.5 whitespace-nowrap"><StatusSolicitacaoBadge status={s.status_solicitacao} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Solicitações em aberto - 1/3 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Em Aberto</h2>
            </div>
            <span className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {stats.solicitacoesAbertas}
            </span>
          </div>
          <div className="p-4 space-y-2 flex-1">
            {porStatus.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-xs">
                <span className="text-2xl mb-2">✓</span>
                Nenhuma pendência!
              </div>
            ) : porStatus.map((s: any) => (
              <Link
                key={s.status_solicitacao}
                href={`/solicitacoes?status=${s.status_solicitacao}`}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
              >
                <StatusSolicitacaoBadge status={s.status_solicitacao} />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 ml-2">
                  {s._count.id}
                </span>
              </Link>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-slate-50 dark:border-slate-800">
            <Link href="/solicitacoes" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              Gerenciar todas →
            </Link>
          </div>
        </div>
      </div>

      {/* Últimas Movimentações */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-violet-50 dark:bg-violet-950 flex items-center justify-center">
              <ArrowLeftRight className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Últimas Movimentações</h2>
          </div>
          <Link href="/movimentacoes" className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
            Ver todas →
          </Link>
        </div>
        <div className="overflow-x-auto">
          {ultimasMovimentacoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs">
              Nenhuma movimentação registrada.
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60">
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Data</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Identificador</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Dispositivo</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Movimentação</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Técnico</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">Setor</th>
                </tr>
              </thead>
              <tbody>
                {ultimasMovimentacoes.map((m: any) => (
                  <tr key={m.id} className="border-t border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(m.data_movimentacao)}</td>
                    <td className="px-4 py-2.5 font-mono font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{m.identificador_dispositivo || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{mapTipoDispositivo(m.tipo_dispositivo)}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{mapTipoMovimentacao(m.tipo_movimentacao)}</td>
                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">{m.tecnico_responsavel || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{m.setor || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  )
}
