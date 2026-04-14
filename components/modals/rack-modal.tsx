'use client'

import { useState } from 'react'
import { X, Pencil, Trash2, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DetailField, DetailSection } from '@/components/modals/detail-field'
import { ConfirmDialog } from '@/components/modals/confirm-dialog'
import { useCrud } from '@/hooks/use-crud'
import type { Rack } from '@/types'

const schema = z.object({
  nome_switch: z.string().optional().nullable(),
  marca_switch: z.string().optional().nullable(),
  localizacao: z.string().optional().nullable(),
  numero_patrimonio: z.string().optional().nullable(),
  quantidade_portas: z.coerce.number().optional().nullable(),
  portas_em_uso: z.coerce.number().optional().nullable(),
  portas_livres: z.coerce.number().optional().nullable(),
})

type FormData = z.infer<typeof schema>
interface Props { rack: Rack; onClose: () => void; onRefresh: () => void }

export function RackModal({ rack, onClose, onRefresh }: Props) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [showConfirm, setShowConfirm] = useState(false)
  const { update, remove, saving, deleting } = useCrud('racks', () => { onRefresh(); onClose() })

  const { register, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome_switch: rack.nome_switch, marca_switch: rack.marca_switch,
      localizacao: rack.localizacao, numero_patrimonio: rack.numero_patrimonio,
      quantidade_portas: rack.quantidade_portas, portas_em_uso: rack.portas_em_uso,
      portas_livres: rack.portas_livres,
    },
  })

  const usoPct = rack.quantidade_portas && rack.portas_em_uso != null
    ? Math.round((rack.portas_em_uso / rack.quantidade_portas) * 100) : null

  const i = "w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
  const l = "block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"

  return (
    <>
      <div className="fixed inset-0 z-50 flex">
        <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <aside className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">{mode === 'edit' ? 'Editar Rack' : (rack.nome_switch || 'Rack')}</h2>
              {mode === 'view' && <p className="text-sm text-slate-500 mt-0.5">{rack.marca_switch} — {rack.localizacao}</p>}
            </div>
            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X className="w-4 h-4" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {mode === 'view' ? (
              <div className="space-y-5">
                {usoPct !== null && (
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-2"><span>Uso de portas</span><span className="font-semibold">{usoPct}%</span></div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div className={`h-2 rounded-full ${usoPct > 80 ? 'bg-red-500' : usoPct > 60 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${usoPct}%` }} />
                    </div>
                  </div>
                )}
                <DetailSection title="Identificação">
                  <DetailField label="Nome Switch" value={rack.nome_switch} />
                  <DetailField label="Marca" value={rack.marca_switch} />
                  <DetailField label="Localização" value={rack.localizacao} />
                  <DetailField label="Nº Patrimônio" value={rack.numero_patrimonio} />
                </DetailSection>
                <DetailSection title="Portas">
                  <DetailField label="Total" value={rack.quantidade_portas} />
                  <DetailField label="Em Uso" value={rack.portas_em_uso} />
                  <DetailField label="Livres" value={rack.portas_livres} />
                  <DetailField label="Acadêmicas" value={rack.portas_academicas} />
                  <DetailField label="VLAN Impressoras" value={rack.portas_vlan_impressoras} />
                </DetailSection>
              </div>
            ) : (
              <form id="edit-form" onSubmit={handleSubmit((d) => update(rack.id, d))} className="grid grid-cols-2 gap-3">
                <div><label className={l}>Nome Switch</label><input {...register('nome_switch')} className={i} /></div>
                <div><label className={l}>Marca</label><input {...register('marca_switch')} className={i} /></div>
                <div><label className={l}>Localização</label><input {...register('localizacao')} className={i} /></div>
                <div><label className={l}>Nº Patrimônio</label><input {...register('numero_patrimonio')} className={i} /></div>
                <div><label className={l}>Total de Portas</label><input type="number" {...register('quantidade_portas')} className={i} /></div>
                <div><label className={l}>Portas em Uso</label><input type="number" {...register('portas_em_uso')} className={i} /></div>
                <div><label className={l}>Portas Livres</label><input type="number" {...register('portas_livres')} className={i} /></div>
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
      {showConfirm && <ConfirmDialog title="Excluir rack" description={`Excluir "${rack.nome_switch}"? Esta ação não pode ser desfeita.`} onConfirm={() => remove(rack.id)} onCancel={() => setShowConfirm(false)} loading={deleting} />}
    </>
  )
}