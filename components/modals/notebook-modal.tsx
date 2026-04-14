'use client'

import { useState } from 'react'
import { X, Pencil, Trash2, User, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CategoriaBadge } from '@/components/dashboard/status-badge'
import { DetailField, DetailSection } from '@/components/modals/detail-field'
import { ConfirmDialog } from '@/components/modals/confirm-dialog'
import { useCrud } from '@/hooks/use-crud'
import { formatDate } from '@/lib/utils'
import type { Notebook } from '@/types'

const schema = z.object({
  modelo: z.string().optional().nullable(),
  fabricante: z.string().optional().nullable(),
  categoria: z.enum(['Administrativa', 'Academica']).optional().nullable(),
  processador: z.string().optional().nullable(),
  memoria: z.string().optional().nullable(),
  armazenamento: z.string().optional().nullable(),
  numero_patrimonio: z.string().optional().nullable(),
  setor: z.string().optional().nullable(),
})

type FormData = z.infer<typeof schema>

interface Props { notebook: Notebook; onClose: () => void; onRefresh: () => void }

export function NotebookModal({ notebook, onClose, onRefresh }: Props) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [showConfirm, setShowConfirm] = useState(false)
  const { update, remove, saving, deleting } = useCrud('notebooks', () => { onRefresh(); onClose() })

  const { register, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      modelo: notebook.modelo, fabricante: notebook.fabricante,
      categoria: notebook.categoria, processador: notebook.processador,
      memoria: notebook.memoria, armazenamento: notebook.armazenamento,
      numero_patrimonio: notebook.numero_patrimonio, setor: notebook.setor,
    },
  })

  const i = "w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
  const l = "block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"

  return (
    <>
      <div className="fixed inset-0 z-50 flex">
        <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <aside className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {mode === 'edit' ? 'Editar Notebook' : (notebook.modelo || 'Notebook')}
              </h2>
              {mode === 'view' && <div className="flex items-center gap-2 mt-1"><CategoriaBadge categoria={notebook.categoria} /><span className="text-xs text-slate-400">{notebook.numero_patrimonio}</span></div>}
            </div>
            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X className="w-4 h-4" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {mode === 'view' ? (
              <div className="space-y-5">
                {notebook.alocacao_ativa && (
                  <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1"><User className="w-4 h-4 text-green-600 dark:text-green-400" /><span className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">Alocação Ativa</span></div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">{notebook.alocacao_ativa.colaborador.nome}</p>
                    {notebook.alocacao_ativa.data_inicio && <p className="text-xs text-green-600 dark:text-green-500">Desde: {formatDate(notebook.alocacao_ativa.data_inicio)}</p>}
                  </div>
                )}
                <DetailSection title="Identificação">
                  <DetailField label="Modelo" value={notebook.modelo} />
                  <DetailField label="Fabricante" value={notebook.fabricante} />
                  <DetailField label="Nº Patrimônio" value={notebook.numero_patrimonio} />
                  <DetailField label="Categoria" value={<CategoriaBadge categoria={notebook.categoria} />} />
                </DetailSection>
                <DetailSection title="Hardware">
                  <DetailField label="Processador" value={notebook.processador} />
                  <DetailField label="Memória" value={notebook.memoria} />
                  <DetailField label="Armazenamento" value={notebook.armazenamento} />
                  <DetailField label="Setor" value={notebook.setor} />
                </DetailSection>
              </div>
            ) : (
              <form id="edit-form" onSubmit={handleSubmit((d) => update(notebook.id, d))} className="grid grid-cols-2 gap-3">
                <div><label className={l}>Modelo</label><input {...register('modelo')} className={i} /></div>
                <div><label className={l}>Fabricante</label><input {...register('fabricante')} className={i} /></div>
                <div className="col-span-2"><label className={l}>Categoria</label>
                  <select {...register('categoria')} className={i}>
                    <option value="">Selecione...</option>
                    <option value="Administrativa">Administrativa</option>
                    <option value="Academica">Acadêmica</option>
                  </select>
                </div>
                <div><label className={l}>Processador</label><input {...register('processador')} className={i} /></div>
                <div><label className={l}>Memória</label><input {...register('memoria')} className={i} /></div>
                <div><label className={l}>Armazenamento</label><input {...register('armazenamento')} className={i} /></div>
                <div><label className={l}>Nº Patrimônio</label><input {...register('numero_patrimonio')} className={i} /></div>
                <div><label className={l}>Setor</label><input {...register('setor')} className={i} /></div>
              </form>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            {mode === 'view' ? (
              <>
                <button onClick={() => setShowConfirm(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition"><Trash2 className="w-3.5 h-3.5" /> Excluir</button>
                <button onClick={() => setMode('edit')} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"><Pencil className="w-3.5 h-3.5" /> Editar</button>
              </>
            ) : (
              <>
                <button onClick={() => setMode('view')} className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Cancelar</button>
                <button type="submit" form="edit-form" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Salvar alterações
                </button>
              </>
            )}
          </div>
        </aside>
      </div>
      {showConfirm && <ConfirmDialog title="Excluir notebook" description={`Excluir "${notebook.modelo}"? Esta ação não pode ser desfeita.`} onConfirm={() => remove(notebook.id)} onCancel={() => setShowConfirm(false)} loading={deleting} />}
    </>
  )
}