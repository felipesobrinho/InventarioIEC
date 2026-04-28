"use client";

import { useState } from "react";
import {
 X,
 Pencil,
 Trash2,
 User,
 Loader2,
 UserPlus,
 UserMinus,
 Check,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { BoolBadge } from "@/components/dashboard/status-badge";
import { DetailField, DetailSection } from "@/components/modals/detail-field";
import { ConfirmDialog } from "@/components/modals/confirm-dialog";
import { ColaboradorSelect } from "@/components/modals/colaborador-select";
import { useCrud } from "@/hooks/use-crud";
import { formatDate } from "@/lib/utils";
import type { Ramal } from "@/types";
import { optionalInt } from "@/lib/zod-helpers";
import { HistoricoPanel } from "./historico-panel";
import { AlocacoesAtivasSection } from "@/components/modals/alocacoes-ativas-section";

const schema = z.object({
 numero_ramal: optionalInt,
 nome_setor: z.string().optional().nullable(),
 prefixo_telefonico: z.string().optional().nullable(),
 disponibilidade: z.string().optional().nullable(),
 fila: z.boolean().optional().nullable(),
 contemplacao: z.boolean().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface Props {
 ramal: Ramal;
 onClose: () => void;
 onRefresh: () => void;
}

export function RamalModal({ ramal, onClose, onRefresh }: Props) {
 const [mode, setMode] = useState<"view" | "edit">("view");
 const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
 const [showDesalocarConfirm, setShowDesalocarConfirm] = useState(false);
 const [colabId, setColabId] = useState("");
 const [colabNome, setColabNome] = useState("");
 const [whatsapp, setWhatsapp] = useState(false);
 const [savingAlocacao, setSavingAlocacao] = useState(false);
 const [editandoId, setEditandoId] = useState<string | null>(null);
 const [novoWhatsapp, setNovoWhatsapp] = useState(false);
 const [savingEdit, setSavingEdit] = useState(false);

 const { update, remove, saving, deleting } = useCrud("ramais", () => {
  onRefresh();
  onClose();
 });

 const { register, handleSubmit } = useForm<FormData>({
  resolver: zodResolver(schema) as any,
  defaultValues: {
   numero_ramal: ramal.numero_ramal,
   nome_setor: ramal.nome_setor,
   prefixo_telefonico: ramal.prefixo_telefonico,
   disponibilidade: ramal.disponibilidade,
   fila: ramal.fila,
   contemplacao: ramal.contemplacao,
  },
 });

 function onSubmit(data: FormData) {
  update(ramal.id, data);
 }

 async function salvarEdicaoAlocacao(alocacaoId: string) {
  setSavingEdit(true);
  try {
   const res = await fetch(`/api/alocacoes/ramais/${alocacaoId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ whatsapp: novoWhatsapp }),
   });
   if (!res.ok) throw new Error();
   toast.success("Alocação atualizada!");
   setEditandoId(null);
   onRefresh();
  } catch {
   toast.error("Erro ao atualizar.");
  } finally {
   setSavingEdit(false);
  }
 }

 async function alocar() {
  if (!colabId) return;
  setSavingAlocacao(true);
  try {
   const res = await fetch("/api/alocacoes/ramais", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
     ramal_id: ramal.id,
     colaborador_id: colabId,
     whatsapp,
    }),
   });
   if (!res.ok) throw new Error();
   toast.success("Ramal alocado com sucesso!");
   onRefresh();
   onClose();
  } catch {
   toast.error("Erro ao alocar.");
  } finally {
   setSavingAlocacao(false);
  }
 }

 async function desalocar() {
  setSavingAlocacao(true);
  try {
   const res = await fetch(`/api/alocacoes/ramais/${ramal.id}/ativo`, {
    method: "DELETE",
   });
   if (!res.ok) throw new Error();
   toast.success("Alocação encerrada.");
   onRefresh();
   onClose();
  } catch {
   toast.error("Erro ao desalocar.");
  } finally {
   setSavingAlocacao(false);
  }
 }

 const inp =
  "w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500";
 const lbl =
  "block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1";

 return (
  <>
   <div className="fixed inset-0 z-50 flex">
    <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <aside className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
     <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800">
      <div>
       <h2 className="text-base font-semibold text-slate-900 dark:text-white font-mono">
        {mode === "edit"
         ? "Editar Ramal"
         : `Ramal ${ramal.numero_ramal ?? "—"}`}
       </h2>
       {mode === "view" && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
         {ramal.nome_setor || "—"}
        </p>
       )}
      </div>
      <button
       type="button"
       onClick={onClose}
       className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      >
       <X className="w-4 h-4" />
      </button>
     </div>

     {mode === "view" && (
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
       <AlocacoesAtivasSection
        itemId={ramal.id}
        entidade="ramais"
        alocacoes={(ramal.alocacoes_ativas ?? []).map((a: any) => ({
         id: a.id,
         colaborador: a.colaborador,
         data_inicio: a.data_inicio ?? null,
         whatsapp: a.whatsapp,
        }))}
        onRefresh={onRefresh}
        onClose={onClose}
        renderExtraForm={(alocacaoId) => {
         const aloc = (ramal.alocacoes_ativas ?? []).find(
          (a: any) => a.id === alocacaoId,
         );
         if (!aloc) return null;
         return editandoId === alocacaoId ? (
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-green-100 dark:border-green-900">
           <label className="flex items-center gap-2 cursor-pointer">
            <input
             type="checkbox"
             checked={novoWhatsapp}
             onChange={(e) => setNovoWhatsapp(e.target.checked)}
             className="w-4 h-4 rounded border-slate-300 text-blue-600"
            />
            <span className="text-xs text-green-700 dark:text-green-300">
             WhatsApp
            </span>
           </label>
           <button
            type="button"
            onClick={() => salvarEdicaoAlocacao(alocacaoId)}
            disabled={savingEdit}
            className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition disabled:opacity-60"
           >
            {savingEdit ? (
             <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
             <Check className="w-3 h-3" />
            )}
            Salvar
           </button>
           <button
            type="button"
            onClick={() => setEditandoId(null)}
            className="text-xs text-slate-400 hover:text-slate-600 transition"
           >
            Cancelar
           </button>
          </div>
         ) : (
          <div className="flex items-center justify-between mt-1.5">
           <span
            className={`
              inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full
              ${
              whatsapp
                ? "bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              }
            `}
            >
            <svg
             viewBox="0 0 24 24"
             className="w-3 h-3 fill-current shrink-0"
             xmlns="http://www.w3.org/2000/svg"
            >
             <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {whatsapp ? "WhatsApp ativo" : "Sem WhatsApp"}
           </span>
           <button
            type="button"
            onClick={() => {
             setEditandoId(alocacaoId);
             setNovoWhatsapp(whatsapp);
            }}
            className="text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 transition"
           >
            Editar
           </button>
          </div>
         );
        }}
       />

       <DetailSection title="Informações do Ramal">
        <DetailField
         label="Número"
         value={ramal.numero_ramal != null ? String(ramal.numero_ramal) : null}
        />
        <DetailField label="Setor" value={ramal.nome_setor} />
        <DetailField
         label="Prefixo Telefônico"
         value={ramal.prefixo_telefonico}
        />
        <DetailField label="Disponibilidade" value={ramal.disponibilidade} />
        <DetailField label="Fila" value={<BoolBadge value={ramal.fila} />} />
        <DetailField
         label="Contemplação"
         value={<BoolBadge value={ramal.contemplacao} />}
        />
       </DetailSection>
       <HistoricoPanel registroId={ramal.id} tabela="ramais" />
      </div>
     )}

     {mode === "edit" && (
      <div className="flex-1 overflow-y-auto p-5">
       <form
        id="ramal-form"
        onSubmit={(e) => {
         e.preventDefault();
         handleSubmit(onSubmit)(e);
        }}
        noValidate
       >
        <div className="grid grid-cols-2 gap-3">
         <div>
          <label className={lbl}>Número do Ramal</label>
          <input type="number" {...register("numero_ramal")} className={inp} />
         </div>
         <div>
          <label className={lbl}>Setor</label>
          <input {...register("nome_setor")} className={inp} />
         </div>
         <div>
          <label className={lbl}>Prefixo Telefônico</label>
          <input {...register("prefixo_telefonico")} className={inp} />
         </div>
         <div>
          <label className={lbl}>Disponibilidade</label>
          <input {...register("disponibilidade")} className={inp} />
         </div>
         <div className="flex items-center gap-2 pt-4">
          <input
           type="checkbox"
           id="fila-edit"
           {...register("fila")}
           className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label
           htmlFor="fila-edit"
           className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
          >
           Fila
          </label>
         </div>
         <div className="flex items-center gap-2 pt-4">
          <input
           type="checkbox"
           id="cont-edit"
           {...register("contemplacao")}
           className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label
           htmlFor="cont-edit"
           className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
          >
           Contemplação
          </label>
         </div>
        </div>
       </form>
      </div>
     )}

     <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
      {mode === "view" ? (
       <>
        <button
         type="button"
         onClick={(e) => {
          e.preventDefault();
          setShowDeleteConfirm(true);
         }}
         className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition"
        >
         <Trash2 className="w-3.5 h-3.5" /> Excluir
        </button>
        <button
         type="button"
         onClick={(e) => {
          e.preventDefault();
          setMode("edit");
         }}
         className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
        >
         <Pencil className="w-3.5 h-3.5" /> Editar
        </button>
       </>
      ) : (
       <>
        <button
         type="button"
         onClick={(e) => {
          e.preventDefault();
          setMode("view");
         }}
         className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
         Cancelar
        </button>
        <button
         type="submit"
         form="ramal-form"
         disabled={saving}
         className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition"
        >
         {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
         Salvar alterações
        </button>
       </>
      )}
     </div>
    </aside>
   </div>

   {showDeleteConfirm && (
    <ConfirmDialog
     title="Excluir ramal"
     description={`Excluir ramal ${ramal.numero_ramal}? Esta ação não pode ser desfeita.`}
     onConfirm={() => remove(ramal.id)}
     onCancel={() => setShowDeleteConfirm(false)}
     loading={deleting}
    />
   )}

   {showDesalocarConfirm && (
    <ConfirmDialog
     title="Encerrar alocação"
     description={`Desalocar "${ramal.alocacao_ativa?.colaborador.nome}" deste ramal?`}
     onConfirm={desalocar}
     onCancel={() => setShowDesalocarConfirm(false)}
     loading={savingAlocacao}
    />
   )}
  </>
 );
}
