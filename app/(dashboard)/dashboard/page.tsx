import { prisma } from "@/lib/prisma";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { SectorOverview, type SectorOverviewRow } from "@/components/dashboard/sector-overview";
import {
 StatusBadge,
 PrioridadeBadge,
} from "@/components/dashboard/status-badge";
import {
 formatDate,
} from "@/lib/utils";
import Link from "next/link";
import { ClipboardList, AlertCircle, TrendingUp } from "lucide-react";
import { UltimasAuditoriasCard } from "@/components/dashboard/last-audits";
import { ExportPdfButton } from "@/components/dashboard/export-pdf-button";
import { GlobalSearch } from '@/components/layout/global-search'

export const dynamic = "force-dynamic";

type InventoryKpiItem = {
 setor_id: string | null
 created_at: Date | null
 unavailable: boolean
}

function monthStart(date: Date) {
 return new Date(date.getFullYear(), date.getMonth(), 1)
}

function monthEnd(date: Date) {
 return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

function buildKpiSeries(items: InventoryKpiItem[]) {
 const base = monthStart(new Date())
 const months = Array.from({ length: 6 }, (_, index) => {
  const date = new Date(base)
  date.setMonth(base.getMonth() - (5 - index))
  return date
 })

 return months.map(month => {
  const end = monthEnd(month)
  const total = items.filter(item => item.created_at && item.created_at <= end).length
  const unavailable = items.filter(item => item.created_at && item.created_at <= end && item.unavailable).length

  return {
   label: month.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", ""),
   total,
   available: Math.max(0, total - unavailable),
   unavailable,
  }
 })
}

async function getDashboardData() {
 const colaboradores = await prisma.colaboradores.count({ where: { status: "Ativo" } });
 const maquinas = await prisma.maquinas.count();
 const notebooks = await prisma.notebooks.count();
 const aparelhos = await prisma.aparelhos.count();
 const impressoras = await prisma.impressoras.count();
 const ramais = await prisma.ramais.count();
 const racks = await prisma.racks.count();
 const solicitacoesAbertas = await prisma.solicitacoes.count({
   where: { status_solicitacao: { notIn: [4, 5] } },
  });

 // groupBy retorna um item por dispositivo único com ativo: true.
 // Mantemos as consultas sequenciais para não estourar o pooler do Supabase local.
 const maquinasAlocadasGroup = await prisma.alocacoes_maquinas.groupBy({
   by: ["maquina_id"],
   where: { ativo: true },
  });
 const notebooksAlocadosGroup = await prisma.alocacoes_notebooks.groupBy({
   by: ["notebook_id"],
   where: { ativo: true },
  });
 const notebooksEmprestados = await prisma.notebooks.findMany({
   where: { emprestado: true },
   select: { id: true },
  });
 const aparelhosAlocadosGroup = await prisma.alocacoes_aparelhos.groupBy({
   by: ["aparelho_id"],
   where: { ativo: true },
  });
 const ramaisAlocadosGroup = await prisma.alocacoes_ramais.groupBy({
   by: ["ramal_id"],
   where: { ativo: true },
  });

 const ultimasSolicitacoes = await prisma.solicitacoes.findMany({ orderBy: { created_at: "desc" }, take: 5 });
 const porStatus = await prisma.solicitacoes.groupBy({
   by: ["status_solicitacao"],
   _count: { id: true },
   where: { status_solicitacao: { notIn: [4, 5] } },
   orderBy: { status_solicitacao: "asc" },
  });
 const setores = await prisma.setores.findMany({
   orderBy: { nome: "asc" },
   include: {
    _count: {
     select: {
      colaboradores: true,
      maquinas: true,
      notebooks: true,
      aparelhos: true,
      impressoras: true,
      ramais: true,
      racks: true,
     },
    },
   },
  });

 const maquinasKpi = await prisma.maquinas.findMany({
  select: {
   setor_id: true,
   created_at: true,
   alocacoes: { where: { ativo: true }, select: { id: true }, take: 1 },
  },
 });
 const notebooksKpi = await prisma.notebooks.findMany({
 select: {
   setor_id: true,
   created_at: true,
   emprestado: true,
   emprestado_setor_id: true,
   emprestado_colaborador: { select: { setor_id: true } },
   alocacoes: {
    where: { ativo: true },
    select: {
     id: true,
     colaborador: { select: { setor_id: true } },
    },
    take: 1,
   },
  },
 });
 const aparelhosKpi = await prisma.aparelhos.findMany({
  select: {
   setor_id: true,
   created_at: true,
   alocacoes: { where: { ativo: true }, select: { id: true }, take: 1 },
  },
 });
 const ramaisKpi = await prisma.ramais.findMany({
  select: {
   setor_id: true,
   created_at: true,
   alocacoes: { where: { ativo: true }, select: { id: true }, take: 1 },
  },
 });

 function getNotebookSectorId(item: (typeof notebooksKpi)[number]) {
  return item.emprestado_colaborador?.setor_id
   ?? item.emprestado_setor_id
   ?? item.alocacoes[0]?.colaborador?.setor_id
   ?? item.setor_id
 }

 const kpiItems: InventoryKpiItem[] = [
  ...maquinasKpi.map(item => ({ setor_id: item.setor_id, created_at: item.created_at, unavailable: item.alocacoes.length > 0 })),
  ...notebooksKpi.map(item => ({ setor_id: getNotebookSectorId(item), created_at: item.created_at, unavailable: item.emprestado || item.alocacoes.length > 0 })),
  ...aparelhosKpi.map(item => ({ setor_id: item.setor_id, created_at: item.created_at, unavailable: item.alocacoes.length > 0 })),
  ...ramaisKpi.map(item => ({ setor_id: item.setor_id, created_at: item.created_at, unavailable: item.alocacoes.length > 0 })),
 ];

 const notebookUnavailableIds = new Set([
  ...notebooksAlocadosGroup.map(item => item.notebook_id).filter(Boolean),
  ...notebooksEmprestados.map(item => item.id),
 ]);

 const notebooksPorSetor = new Map<string, number>()
 for (const notebook of notebooksKpi) {
  const setorId = getNotebookSectorId(notebook)
  if (!setorId) continue
  notebooksPorSetor.set(setorId, (notebooksPorSetor.get(setorId) ?? 0) + 1)
 }

 const setoresOverview: SectorOverviewRow[] = setores.map(setor => ({
  id: setor.id,
  nome: setor.nome,
  descricao: setor.descricao,
  ativo: setor.ativo,
  created_at: setor.created_at?.toISOString() ?? null,
  counts: {
   colaboradores: setor._count.colaboradores,
   maquinas: setor._count.maquinas,
   notebooks: notebooksPorSetor.get(setor.id) ?? 0,
   aparelhos: setor._count.aparelhos,
   impressoras: setor._count.impressoras,
   ramais: setor._count.ramais,
   racks: setor._count.racks,
  },
  kpi: buildKpiSeries(kpiItems.filter(item => item.setor_id === setor.id)),
 }));

 return {
  stats: {
   colaboradores,
   maquinas,
   notebooks,
   aparelhos,
   impressoras,
   ramais,
   racks,
   solicitacoesAbertas,
   maquinasAlocadas: maquinasAlocadasGroup.length,
   notebooksAlocados: notebookUnavailableIds.size,
   aparelhosAlocados: aparelhosAlocadosGroup.length,
   ramaisAlocados: ramaisAlocadosGroup.length,
  },
  ultimasSolicitacoes,
  porStatus,
  setoresOverview,
 };
}

export default async function DashboardPage() {
 const { stats, ultimasSolicitacoes, porStatus, setoresOverview } =
  await getDashboardData();

 return (
  <div className="p-6 max-w-7xl mx-auto">
   {/* Header */}
   <div className="flex items-center gap-4 mb-5">
  {/* Título — lado esquerdo */}
  <div className="shrink-0">
    <h1 className="text-xl font-bold text-slate-900 dark:text-white">
      Dashboard
    </h1>
    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
      Visão geral do inventário de TI
    </p>
  </div>

  {/* Search — centro, cresce para preencher o espaço disponível */}
  <GlobalSearch className="flex-1 min-w-0" />

  {/* Ações — lado direito */}
  <div className="flex items-center gap-2 shrink-0">
    <div className="flex items-center gap-2 text-xs text-slate-400 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg px-3 py-1.5">
      <TrendingUp className="w-3.5 h-3.5" />
      Atualizado agora
    </div>
    <ExportPdfButton />
  </div>
</div>

   <SectorOverview setores={setoresOverview} />

   {/* Stats */}
   <StatsCards stats={stats} />

   {/* Bottom grid */}
   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
    {/* Últimas Solicitações */}
    <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
     <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-2">
       <ClipboardList className="w-4 h-4 text-slate-400" />
       <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        Últimas Solicitações
       </h2>
      </div>
      <Link
       href="/solicitacoes"
       className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
      >
       Ver todas →
      </Link>
     </div>
     <div className="overflow-x-auto">
      <table className="w-full text-sm">
       <thead>
        <tr className="bg-slate-50 dark:bg-slate-800/50">
         <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">
          Data
         </th>
         <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">
          Colaborador
         </th>
         <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">
          Tipo
         </th>
         <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">
          Prioridade
         </th>
         <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">
          Status
         </th>
        </tr>
       </thead>
       <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
        {ultimasSolicitacoes.length === 0 ? (
         <tr>
          <td
           colSpan={5}
           className="px-4 py-8 text-center text-slate-400 text-xs"
          >
           Nenhuma solicitação.
          </td>
         </tr>
        ) : (
         ultimasSolicitacoes.map((s) => (
          <tr
           key={s.id}
           className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
          >
           <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
            {formatDate(s.data_criacao)}
           </td>
           <td className="px-4 py-3 text-slate-800 dark:text-slate-200 text-xs font-medium truncate max-w-[120px]">
            {s.colaborador_relacionado || "—"}
           </td>
           <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
            {s.tipo_solicitacao || "—"}
           </td>
           <td className="px-4 py-3">
            <PrioridadeBadge prioridade={s.prioridade} />
           </td>
           <td className="px-4 py-3">
            <StatusBadge status={s.status_solicitacao} />
           </td>
          </tr>
         ))
        )}
       </tbody>
      </table>
     </div>
    </div>

    {/* Solicitações em aberto */}
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
     <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
      <AlertCircle className="w-4 h-4 text-amber-500" />
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
       Em Aberto
      </h2>
      <span className="ml-auto bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full">
       {stats.solicitacoesAbertas}
      </span>
     </div>
     <div className="p-5 space-y-3">
      {porStatus.length === 0 ? (
       <p className="text-xs text-slate-400 text-center py-4">
        Nenhuma solicitação em aberto.
       </p>
      ) : (
       porStatus.map((s) => (
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
       ))
      )}
     </div>
    </div>
   </div>

   {/* Últimas Movimentações */}
   <UltimasAuditoriasCard />
  </div>
 );
}
