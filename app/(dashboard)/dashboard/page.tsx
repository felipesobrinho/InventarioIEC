import { prisma } from '@/lib/prisma'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { StatusBadge, PrioridadeBadge } from '@/components/dashboard/status-badge'
import { formatDate, mapTipoDispositivo, mapTipoMovimentacao } from '@/lib/utils'
import Link from 'next/link'
import { ClipboardList, ArrowLeftRight, AlertCircle } from 'lucide-react'
import { UltimasAuditoriasCard } from '@/components/dashboard/last-audits'

export const dynamic = 'force-dynamic'

async function getDashboardData() {
  const [
    colaboradores, maquinas, notebooks, aparelhos,
    impressoras, ramais, racks,
    solicitacoesAbertas,
    maquinasAlocadasList,
    notebooksAlocadosList,
    aparelhosAlocadosList,
    ramaisAlocadosList,
    ultimasSolicitacoes,
    ultimasMovimentacoes,
    porStatus,
  ] = await Promise.all([
    prisma.colaboradores.count({ where: { status: 'Ativo' } }),
    prisma.maquinas.count(),
    prisma.notebooks.count(),
    prisma.aparelhos.count(),
    prisma.impressoras.count(),
    prisma.ramais.count(),
    prisma.racks.count(),
    prisma.solicitacoes.count({ where: { status_solicitacao: { notIn: [4, 5] } } }),

    // Buscar IDs distintos de itens alocados — evita dupla contagem
    prisma.alocacoes_maquinas.findMany({
      where: { ativo: true },
      select: { maquina_id: true },
      distinct: ['maquina_id'],
    }),
    prisma.alocacoes_notebooks.findMany({
      where: { ativo: true },
      select: { notebook_id: true },
      distinct: ['notebook_id'],
    }),
    prisma.alocacoes_aparelhos.findMany({
      where: { ativo: true },
      select: { aparelho_id: true },
      distinct: ['aparelho_id'],
    }),
    prisma.alocacoes_ramais.findMany({
      where: { ativo: true },
      select: { ramal_id: true },
      distinct: ['ramal_id'],
    }),

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
      // .length dá o número de itens únicos alocados
      maquinasAlocadas:  maquinasAlocadasList.length,
      notebooksAlocados: notebooksAlocadosList.length,
      aparelhosAlocados: aparelhosAlocadosList.length,
      ramaisAlocados:    ramaisAlocadosList.length,
    },
    ultimasSolicitacoes,
    ultimasMovimentacoes,
    porStatus,
  }
}

export default async function DashboardPage() {
  const { stats, ultimasSolicitacoes, ultimasMovimentacoes, porStatus } = await getDashboardData()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Visão geral do inventário de TI
        </p>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Últimas Solicitações */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Últimas Solicitações</h2>
            </div>
            <Link href="/solicitacoes" className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400">
              Ver todas →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Data</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Colaborador</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Tipo</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Prioridade</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {ultimasSolicitacoes.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs">Nenhuma solicitação.</td></tr>
                ) : ultimasSolicitacoes.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">{formatDate(s.data_criacao)}</td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200 text-xs font-medium truncate max-w-[120px]">{s.colaborador_relacionado || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">{s.tipo_solicitacao || '—'}</td>
                    <td className="px-4 py-3"><PrioridadeBadge prioridade={s.prioridade} /></td>
                    <td className="px-4 py-3"><StatusBadge status={s.status_solicitacao} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Solicitações em aberto */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Em Aberto</h2>
            <span className="ml-auto bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full">
              {stats.solicitacoesAbertas}
            </span>
          </div>
          <div className="p-5 space-y-3">
            {porStatus.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Nenhuma solicitação em aberto.</p>
            ) : porStatus.map((s: any) => (
              <Link
                key={s.status_solicitacao}
                href={`/solicitacoes?status=${s.status_solicitacao}`}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition group"
              >
                <StatusBadge status={s.status_solicitacao} />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-600">
                  {s._count.id}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Últimas Movimentações */}
      <UltimasAuditoriasCard />
    </div>
  )
}
