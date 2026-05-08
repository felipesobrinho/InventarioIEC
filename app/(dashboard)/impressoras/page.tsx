"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation"; // FIX: import adicionado
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/tables/data-table";
import {
<<<<<<< dev-v1.0
 ImpressoraOverviewPanel,
 type OverviewFilter,
 notifyOverviewFilter,
=======
  ImpressoraOverviewPanel,
  type OverviewFilter,
  OverviewFilterToastDescription,
>>>>>>> prod-v1.0
} from "@/components/tables/device-overview-panel";
import { PageHeader } from "@/components/layout/page-header";
import { BoolBadge } from "@/components/dashboard/status-badge";
import { ImpressoraModal } from "@/components/modals/impressora-modal";
import { Search } from "lucide-react";
import type { Impressora, PaginatedResponse } from "@/types";
import { CriarImpressoraModal } from "@/components/modals/criar-impressora-modal";
import { Plus } from "lucide-react";
import { SetorSelect } from "@/components/modals/setor-select";
import { useSearchParams } from "next/navigation";

type ActiveOverviewFilter = OverviewFilter & {
 key: string;
 predicate: (item: Impressora) => boolean;
};

function isMissing(value: unknown) {
  return value === null || value === undefined || value === "";
}

function isRevisionStale(value?: string | null) {
  if (!value) return true;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return true;
  return Math.floor((Date.now() - time) / 86_400_000) > 90;
}

function hasMissingPrinterData(item: Impressora) {
  return [
    item.nome_host,
    item.fabricante,
    item.modelo,
    item.numero_serie,
    item.endereco_ip,
  ].some(isMissing);
}

export default function ImpressorasPage() {
 const searchParams = useSearchParams();
 const [data, setData] = useState<Impressora[]>([]);
 const [total, setTotal] = useState(0);
 const [totalPages, setTotalPages] = useState(1);
 const [overviewData, setOverviewData] = useState<Impressora[]>([]);
 const [overviewTotal, setOverviewTotal] = useState(0);
 const [overviewLoading, setOverviewLoading] = useState(true);
 const [page, setPage] = useState(1);
 const [loading, setLoading] = useState(true);
 const [selected, setSelected] = useState<Impressora | null>(null);
 const [search, setSearch] = useState("");
 const [setorIdFiltro, setSetorIdFiltro] = useState<string | null>(searchParams.get("setor_id"));
 const [andar, setAndar] = useState("");
 const [status, setStatus] = useState("");
 const [refreshKey, setRefreshKey] = useState(0);
 const [showCriar, setShowCriar] = useState(false);
 const [activeOverviewFilters, setActiveOverviewFilters] = useState<ActiveOverviewFilter[]>([]);
 const [overviewFilterLoading, setOverviewFilterLoading] = useState(false);

 const fetchData = useCallback(async () => {
  setLoading(true);
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (search) params.set("search", search);
  if (setorIdFiltro) params.set("setor_id", setorIdFiltro);
  if (andar) params.set("andar", andar);
  if (status) params.set("status", status);
  const res = await fetch(`/api/impressoras?${params}`);
  const json: PaginatedResponse<Impressora> = await res.json();
  setData(json.data);
  setTotal(json.total);
  setTotalPages(json.totalPages);
  setLoading(false);
 }, [page, search, setorIdFiltro, andar, status]);

 useEffect(() => {
  void Promise.resolve().then(fetchData);
 }, [fetchData, refreshKey]);
        
  // FIX: se o item já está na página atual, abre direto sem fetch extra
  useEffect(() => {
    if (!inspectId || data.length === 0) return;
    const found = data.find((d) => d.id === inspectId);
    if (found) setSelected(found);
  }, [inspectId, data]);

  // FIX: se não encontrou na lista paginada atual, busca direto pela API
  useEffect(() => {
    if (!inspectId) return;
    fetch(`/api/impressoras/${inspectId}`)
      .then((r) => r.json())
      .then((item) => { if (item) setSelected(item); });
  }, [inspectId]);

 const filteredOverviewData = activeOverviewFilters.length > 0
  ? overviewData.filter((item) => matchesOverviewFilters(item, activeOverviewFilters))
  : null;
 const tableData = filteredOverviewData
  ? filteredOverviewData.slice((page - 1) * 20, page * 20)
  : data;
 const tableTotal = filteredOverviewData?.length ?? total;
 const tableTotalPages = filteredOverviewData
  ? Math.max(1, Math.ceil(filteredOverviewData.length / 20))
  : totalPages;

 function applyOverviewFilter(filter: OverviewFilter) {
  if (filter.kind === "all") {
   setActiveOverviewFilters([]);
   setPage(1);
   notifyOverviewFilter([]);
   return;
  }

  const predicates: Record<
   string,
   { label: string; predicate: (item: Impressora) => boolean }
  > = {
   "printer-status": {
    label:
     filter.value === "false" ? "Impressoras inativas" : "Impressoras ativas",
    predicate: (item) =>
     filter.value === "false" ? item.status === false : item.status !== false,
   },
   "printer-stale": {
    label: "Impressoras sem revisao em 3 meses",
    predicate: (item) => isRevisionStale(item.revisao),
   },
   "printer-no-revision": {
    label: "Impressoras sem revisao registrada",
    predicate: (item) => !item.revisao,
   },
   "printer-missing-data": {
    label: "Impressoras com dados faltantes",
    predicate: hasMissingPrinterData,
   },
   "printer-no-ip": {
    label: "Impressoras sem IP",
    predicate: (item) => isMissing(item.endereco_ip),
   },
   "printer-no-sector": {
    label: "Impressoras sem setor registrado",
    predicate: (item) => !item.setor_id || !item.setor_nome,
   },
   "printer-no-identity": {
    label: "Impressoras sem identificacao",
    predicate: (item) =>
     isMissing(item.nome_host) || isMissing(item.numero_serie),
   },
   "printer-attention": {
    label: "Impressoras que requerem atencao",
    predicate: (item) =>
     item.status === false ||
     isRevisionStale(item.revisao) ||
     hasMissingPrinterData(item),
   },
   "printer-sector": {
    label: `Setor: ${filter.value ?? "Sem setor registrado"}`,
    predicate: (item) =>
     (item.setor_id && item.setor_nome ? item.setor_nome : "Sem setor registrado") === filter.value,
   },
  };

  const nextFilter = predicates[filter.kind];
  if (!nextFilter) return;
  const candidate: ActiveOverviewFilter = {
   ...filter,
   key: getOverviewFilterKey(filter),
   label: nextFilter.label,
   predicate: nextFilter.predicate,
  };

  setOverviewFilterLoading(true);
  window.setTimeout(() => {
   setActiveOverviewFilters((currentFilters) => {
    const nextFilters = toggleOverviewFilter(currentFilters, candidate);
    notifyOverviewFilter(nextFilters);
    return nextFilters;
   });
   setPage(1);
   setOverviewFilterLoading(false);
  }, 120);
 }

    const nextFilter = predicates[filter.kind];
    if (!nextFilter) return;

    const description = (
      <OverviewFilterToastDescription label={nextFilter.label} filter={filter} />
    );
    const toastId = toast.loading("Aplicando filtro do overview...", {
      description,
    });
    setOverviewFilterLoading(true);
    window.setTimeout(() => {
      setActiveOverviewFilter(nextFilter);
      setPage(1);
      setOverviewFilterLoading(false);
      toast.success("Filtro aplicado.", { id: toastId, description });
    }, 120);
  }

  useEffect(() => {
    let cancelled = false;
    async function fetchOverview() {
      setOverviewLoading(true);
      try {
        const params = new URLSearchParams({
          page: "1",
          limit: "10000",
          sort: "created_at",
          dir: "desc",
        });
        const res = await fetch(`/api/impressoras?${params}`);
        const json: PaginatedResponse<Impressora> = await res.json();
        if (!cancelled) {
          setOverviewData(json.data);
          setOverviewTotal(json.total);
        }
      } catch (error) {
        console.error("[impressoras overview]", error);
      } finally {
        if (!cancelled) setOverviewLoading(false);
      }
    }

    fetchOverview();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const filters = (
    <>
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por nome host ou nº série..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <SetorSelect
        value={setorIdFiltro}
        onChange={(value) => {
          setSetorIdFiltro(value);
          setPage(1);
        }}
        placeholder="Filtrar por setor..."
      />
      <input
        value={andar}
        onChange={(e) => {
          setAndar(e.target.value);
          setPage(1);
        }}
        placeholder="Andar..."
        className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-28"
      />
      <select
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          setPage(1);
        }}
        className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Todos os status</option>
        <option value="true">Ativo</option>
        <option value="false">Inativo</option>
      </select>
    </>
  );

 return (
  <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">
   <PageHeader title="Impressoras" total={total}>
    <button
     type="button"
     onClick={() => setShowCriar(true)}
     className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
    >
     <Plus className="w-4 h-4" /> Nova impressora
    </button>
   </PageHeader>
   <ImpressoraOverviewPanel
    total={overviewTotal || total}
    items={overviewData}
    activeFilters={activeOverviewFilters}
    isLoading={overviewLoading}
    onFilter={applyOverviewFilter}
   />
   <DataTable
    columns={columns}
    data={tableData}
    total={tableTotal}
    page={page}
    totalPages={tableTotalPages}
    onPageChange={setPage}
    onRowClick={setSelected}
    isLoading={loading || overviewFilterLoading}
    filters={filters}
   />
   {selected && (
    <ImpressoraModal
     impressora={selected}
     onClose={() => setSelected(null)}
     onRefresh={() => setRefreshKey((k) => k + 1)}
    />
   )}
   {showCriar && (
    <CriarImpressoraModal
     onClose={() => setShowCriar(false)}
     onRefresh={() => setRefreshKey((k) => k + 1)}
    />
   )}
  </div>
 );
}

function getOverviewFilterKey(filter: OverviewFilter) {
 return `${filter.kind}:${filter.value ?? ""}`;
}

function toggleOverviewFilter(filters: ActiveOverviewFilter[], candidate: ActiveOverviewFilter) {
 const exists = filters.some((filter) => filter.key === candidate.key);
 if (exists) return filters.filter((filter) => filter.key !== candidate.key);
 return [...filters, candidate];
}

function matchesOverviewFilters(item: Impressora, filters: ActiveOverviewFilter[]) {
 const filtersByKind = filters.reduce((map, filter) => {
  const group = map.get(filter.kind) ?? [];
  group.push(filter);
  map.set(filter.kind, group);
  return map;
 }, new Map<string, ActiveOverviewFilter[]>());

 return Array.from(filtersByKind.values()).every((group) =>
  group.some((filter) => filter.predicate(item))
 );
}
