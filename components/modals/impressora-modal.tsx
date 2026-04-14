'use client'

import { useState } from 'react'
import { X, Pencil, Trash2, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BoolBadge } from '@/components/dashboard/status-badge'
import { DetailField, DetailSection } from '@/components/modals/detail-field'
import { ConfirmDialog } from '@/components/modals/confirm-dialog'
import { useCrud } from '@/hooks/use-crud'
import { formatDate } from '@/lib/utils'
import type { Impressora } from '@/types'

const schema = z.object({
  nome_host: z.string().optional().nullable(),
  fabricante: z.string().optional().nullable(),
  modelo: z.string().optional().nullable(),
  numero_serie: z.string().optional().nullable(),
  endereco_ip: z.string().optional().nullable(),
  localidade: z.string().optional().nullable(),
  andar: z.string().optional().nullable(),
  servidor_impressao: z.string().optional().nullable(),
  tipo_usuario: z.string().optional().nullable(),
  status: z.boolean().optional().nullable(),
})

type FormData = z.infer<typeof schema>
interface Props { impressora: Impressora; onClose: () => void; onRefresh: () => void }

export function ImpressoraModal({ impressora, onClose, onRefresh }: Props) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [showConfirm, setShowConfirm] = useState(false)
  const { update, remove, saving, deleting } = useCrud('impressoras', () => { onRefresh(); onClose() })

  const { register, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome_host: impressora.nome_host, fabricante: impressora.fabricante,
      modelo: impressora.modelo, numero_serie: impressora.numero_serie,
      endereco_ip: impressora.endereco_ip, localidade: impressora.localidade,
      andar: impressora.andar, servidor_impressao: impressora.servidor_impressao,
      tipo_usuario: impressora.tipo_usuario, status: impressora.status,
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
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">{mode === 'edit' ? 'Editar Impressora' : (impressora.nome_host || 'Impressora')}</h2>
              {mode === 'view' && <p className="text-sm text-slate-500 mt-0.5">{impressora.fabricante} {impressora.modelo}</p>}
            </div>
            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X className="w-4 h-4" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {mode === 'view' ? (
              <div className="space-y-5">
                <DetailSection title="Identificação">
                  <DetailField label="Nome Host" value={impressora.nome_host} />
                  <DetailField label="Fabricante" value={impressora.fabricante} />
                  <DetailField label="Modelo" value={impressora.modelo} />
                  <DetailField label="Nº de Série" value={impressora.numero_serie} />
                  <DetailField label="Status" value={<BoolBadge value={impressora.status} labelTrue="Ativo" labelFalse="Inativo" />} />
                </DetailSection>
                <DetailSection title="Rede e Localização">
                  <DetailField label="Endereço IP" value={impressora.endereco_ip} />
                  <DetailField label="Servidor Impressão" value={impressora.servidor_impressao} />
                  <DetailField label="Localidade" value={impressora.localidade} />
                  <DetailField label="Andar" value={impressora.andar} />
                  <DetailField label="Tipo de Usuário" value={impressora.tipo_usuario} />
                  <DetailField label="Revisão" value={formatDate(impressora.revisao)} />
                </DetailSection>
              </div>
            ) : (
              <form id="edit-form" onSubmit={handleSubmit((d) => update(impressora.id, d))} className="grid grid-cols-2 gap-3">
                <div><label className={l}>Nome Host</label><input {...register('nome_host')} className={i} /></div>
                <div><label className={l}>Fabricante</label><input {...register('fabricante')} className={i} /></div>
                <div><label className={l}>Modelo</label><input {...register('modelo')} className={i} /></div>
                <div><label className={l}>Nº de Série</label><input {...register('numero_serie')} className={i} /></div>
                <div><label className={l}>Endereço IP</label><input {...register('endereco_ip')} className={i} /></div>
                <div><label className={l}>Servidor Impressão</label><input {...register('servidor_impressao')} className={i} /></div>
                <div><label className={l}>Localidade</label><input {...register('localidade')} className={i} /></div>
                <div><label className={l}>Andar</label><input {...register('andar')} className={i} /></div>
                <div><label className={l}>Tipo de Usuário</label><input {...register('tipo_usuario')} className={i} /></div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" id="status-imp" {...register('status')} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <label htmlFor="status-imp" className="text-sm text-slate-700 dark:text-slate-300">Ativo</label>
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
      {showConfirm && <ConfirmDialog title="Excluir impressora" description={`Excluir "${impressora.nome_host}"? Esta ação não pode ser desfeita.`} onConfirm={() => remove(impressora.id)} onCancel={() => setShowConfirm(false)} loading={deleting} />}
    </>
  )
}