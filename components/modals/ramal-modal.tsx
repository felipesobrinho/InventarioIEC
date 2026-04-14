'use client'

import { useState } from 'react'
import { X, Pencil, Trash2, User, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BoolBadge } from '@/components/dashboard/status-badge'
import { DetailField, DetailSection } from '@/components/modals/detail-field'
import { ConfirmDialog } from '@/components/modals/confirm-dialog'
import { useCrud } from '@/hooks/use-crud'
import { formatDate } from '@/lib/utils'
import type { Ramal } from '@/types'

const schema = z.object({
  numero_ramal: z.coerce.number().optional().nullable(),
  nome_setor: z.string().optional().nullable(),
  prefixo_telefonico: z.string().optional().nullable(),
  disponibilidade: z.string().optional().nullable(),
  fila: z.boolean().optional().nullable(),
  contemplacao: z.boolean().optional().nullable(),
})

type FormData = z.infer<typeof schema>
interface Props { ramal: Ramal; onClose: () => void; onRefresh: () => void }

export function RamalModal({ ramal, onClose, onRefresh }: Props) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [showConfirm, setShowConfirm] = useState(false)
  const { update, remove, saving, deleting } = useCrud('ramais', () => { onRefresh(); onClose() })

  const { register, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      numero_ramal: ramal.numero_ramal, nome_setor: ramal.nome_setor,
      prefixo_telefonico: ramal.prefixo_telefonico, disponibilidade: ramal.disponibilidade,
      fila: ramal.fila, contemplacao: ramal.contemplacao,
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
              <h2 className="text-base font-semibold text-slate-900 dark:text-white font-mono">{mode === 'edit' ? 'Editar Ramal' : `Ramal ${ramal.numero_ramal ?? '—'}`}</h2>
              {mode === 'view' && <p className="text-sm text-slate-500 mt-0.5">{ramal.nome_setor || '—'}</p>}
            </div>
            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X className="w-4 h-4" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {mode === 'view' ? (
              <div className="space-y-5">
                {ramal.alocacao_ativa && (
                  <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1"><User className="w-4 h-4 text-green-600 dark:text-green-400" /><span className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase">Alocação Ativa</span></div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">{ramal.alocacao_ativa.colaborador.nome}</p>
                  </div>
                )}
                <DetailSection title="Informações">
                  <DetailField label="Número" value={ramal.numero_ramal != null ? String(ramal.numero_ramal) : null} />
                  <DetailField label="Setor" value={ramal.nome_setor} />
                  <DetailField label="Prefixo" value={ramal.prefixo_telefonico} />
                  <DetailField label="Disponibilidade" value={ramal.disponibilidade} />
                  <DetailField label="Fila" value={<BoolBadge value={ramal.fila} />} />
                  <DetailField label="Contemplação" value={<BoolBadge value={ramal.contemplacao} />} />
                </DetailSection>
              </div>
            ) : (
              <form id="edit-form" onSubmit={handleSubmit((d) => update(ramal.id, d))} className="grid grid-cols-2 gap-3">
                <div><label className={l}>Número do Ramal</label><input type="number" {...register('numero_ramal')} className={i} /></div>
                <div><label className={l}>Setor</label><input {...register('nome_setor')} className={i} /></div>
                <div><label className={l}>Prefixo Telefônico</label><input {...register('prefixo_telefonico')} className={i} /></div>
                <div><label className={l}>Disponibilidade</label><input {...register('disponibilidade')} className={i} /></div>
                <div className="flex items-center gap-2 pt-4">
                  <input type="checkbox" id="fila-r" {...register('fila')} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                  <label htmlFor="fila-r" className="text-sm text-slate-700 dark:text-slate-300">Fila</label>
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input type="checkbox" id="cont-r" {...register('contemplacao')} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                  <label htmlFor="cont-r" className="text-sm text-slate-700 dark:text-slate-300">Contemplação</label>
                </div>
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
      {showConfirm && <ConfirmDialog title="Excluir ramal" description={`Excluir ramal ${ramal.numero_ramal}? Esta ação não pode ser desfeita.`} onConfirm={() => remove(ramal.id)} onCancel={() => setShowConfirm(false)} loading={deleting} />}
    </>
  )
}