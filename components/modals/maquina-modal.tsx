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
import type { Maquina } from '@/types'

const schema = z.object({
  nome_host: z.string().optional().nullable(),
  identificador: z.string().optional().nullable(),
  fabricante: z.string().optional().nullable(),
  modelo: z.string().optional().nullable(),
  categoria: z.enum(['Administrativa', 'Academica']).optional().nullable(),
  processador: z.string().optional().nullable(),
  memoria_ram: z.string().optional().nullable(),
  armazenamento: z.string().optional().nullable(),
  endereco_ip: z.string().optional().nullable(),
  localizacao: z.string().optional().nullable(),
  setor: z.string().optional().nullable(),
  patrimonio_cpu: z.string().optional().nullable(),
  patrimonio_monitor: z.string().optional().nullable(),
})

type FormData = z.infer<typeof schema>

interface Props {
  maquina: Maquina
  onClose: () => void
  onRefresh: () => void
}

export function MaquinaModal({ maquina, onClose, onRefresh }: Props) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [showConfirm, setShowConfirm] = useState(false)
  const { update, remove, saving, deleting } = useCrud('maquinas', () => { onRefresh(); onClose() })

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome_host: maquina.nome_host,
      identificador: maquina.identificador,
      fabricante: maquina.fabricante,
      modelo: maquina.modelo,
      categoria: maquina.categoria,
      processador: maquina.processador,
      memoria_ram: maquina.memoria_ram,
      armazenamento: maquina.armazenamento,
      endereco_ip: maquina.endereco_ip,
      localizacao: maquina.localizacao,
      setor: maquina.setor,
      patrimonio_cpu: maquina.patrimonio_cpu,
      patrimonio_monitor: maquina.patrimonio_monitor,
    },
  })

  const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
  const labelCls = "block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"

  return (
    <>
      <div className="fixed inset-0 z-50 flex">
        <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <aside className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {mode === 'edit' ? 'Editar Máquina' : (maquina.nome_host || 'Máquina')}
              </h2>
              {mode === 'view' && (
                <div className="flex items-center gap-2 mt-1">
                  <CategoriaBadge categoria={maquina.categoria} />
                  {maquina.identificador && <span className="text-xs text-slate-400">{maquina.identificador}</span>}
                </div>
              )}
            </div>
            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {mode === 'view' ? (
              <div className="space-y-5">
                {maquina.alocacao_ativa && (
                  <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">Alocação Ativa</span>
                    </div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">{maquina.alocacao_ativa.colaborador.nome}</p>
                    {maquina.alocacao_ativa.colaborador.setor && <p className="text-xs text-green-600 dark:text-green-500">{maquina.alocacao_ativa.colaborador.setor}</p>}
                    {maquina.alocacao_ativa.data_inicio && <p className="text-xs text-green-600 dark:text-green-500 mt-1">Desde: {formatDate(maquina.alocacao_ativa.data_inicio)}</p>}
                  </div>
                )}
                <DetailSection title="Identificação">
                  <DetailField label="Nome Host" value={maquina.nome_host} />
                  <DetailField label="Identificador" value={maquina.identificador} />
                  <DetailField label="Patrimônio CPU" value={maquina.patrimonio_cpu} />
                  <DetailField label="Patrimônio Monitor" value={maquina.patrimonio_monitor} />
                </DetailSection>
                <DetailSection title="Hardware">
                  <DetailField label="Fabricante" value={maquina.fabricante} />
                  <DetailField label="Modelo" value={maquina.modelo} />
                  <DetailField label="Processador" value={maquina.processador} />
                  <DetailField label="Memória RAM" value={maquina.memoria_ram} />
                  <DetailField label="Armazenamento" value={maquina.armazenamento} />
                  <DetailField label="Tipo" value={maquina.tipo} />
                </DetailSection>
                <DetailSection title="Rede e Localização">
                  <DetailField label="Endereço IP" value={maquina.endereco_ip} />
                  <DetailField label="Localização" value={maquina.localizacao} />
                  <DetailField label="Setor" value={maquina.setor} />
                  <DetailField label="Categoria" value={<CategoriaBadge categoria={maquina.categoria} />} />
                  <DetailField label="Data Revisão" value={formatDate(maquina.data_revisao)} />
                </DetailSection>
              </div>
            ) : (
              <form id="edit-form" onSubmit={handleSubmit((d) => update(maquina.id, d))} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Nome Host</label>
                    <input {...register('nome_host')} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Identificador</label>
                    <input {...register('identificador')} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Fabricante</label>
                    <input {...register('fabricante')} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Modelo</label>
                    <input {...register('modelo')} className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Categoria</label>
                    <select {...register('categoria')} className={inputCls}>
                      <option value="">Selecione...</option>
                      <option value="Administrativa">Administrativa</option>
                      <option value="Academica">Acadêmica</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Processador</label>
                    <input {...register('processador')} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Memória RAM</label>
                    <input {...register('memoria_ram')} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Armazenamento</label>
                    <input {...register('armazenamento')} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Endereço IP</label>
                    <input {...register('endereco_ip')} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Localização</label>
                    <input {...register('localizacao')} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Setor</label>
                    <input {...register('setor')} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Patrimônio CPU</label>
                    <input {...register('patrimonio_cpu')} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Patrimônio Monitor</label>
                    <input {...register('patrimonio_monitor')} className={inputCls} />
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            {mode === 'view' ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir
                </button>
                <button
                  onClick={() => setMode('edit')}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setMode('view')} className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="edit-form"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Salvar alterações
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {showConfirm && (
        <ConfirmDialog
          title="Excluir máquina"
          description={`Tem certeza que deseja excluir "${maquina.nome_host || maquina.identificador}"? Esta ação não pode ser desfeita.`}
          onConfirm={() => remove(maquina.id)}
          onCancel={() => setShowConfirm(false)}
          loading={deleting}
        />
      )}
    </>
  )
}