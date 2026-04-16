'use client'

import { useState } from 'react'
import { X, Pencil, Trash2, User, Loader2, UserPlus, UserMinus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { CategoriaBadge } from '@/components/dashboard/status-badge'
import { DetailField, DetailSection } from '@/components/modals/detail-field'
import { ConfirmDialog } from '@/components/modals/confirm-dialog'
import { ColaboradorSelect } from '@/components/modals/colaborador-select'
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

interface Props {
  notebook: Notebook
  onClose: () => void
  onRefresh: () => void
}

export function NotebookModal({ notebook, onClose, onRefresh }: Props) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDesalocarConfirm, setShowDesalocarConfirm] = useState(false)
  const [colabId, setColabId] = useState('')
  const [colabNome, setColabNome] = useState('')
  const [savingAlocacao, setSavingAlocacao] = useState(false)

  const { update, remove, saving, deleting } = useCrud('notebooks', () => {
    onRefresh()
    onClose()
  })

  const { register, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      modelo: notebook.modelo,
      fabricante: notebook.fabricante,
      categoria: notebook.categoria,
      processador: notebook.processador,
      memoria: notebook.memoria,
      armazenamento: notebook.armazenamento,
      numero_patrimonio: notebook.numero_patrimonio,
      setor: notebook.setor,
    },
  })

  // Chamado APENAS pelo botão type="submit" form="nb-form"
  function onSubmit(data: FormData) {
    update(notebook.id, data)
  }

  async function alocar() {
    if (!colabId) return
    setSavingAlocacao(true)
    try {
      const res = await fetch('/api/alocacoes/notebooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notebook_id: notebook.id, colaborador_id: colabId }),
      })
      if (!res.ok) throw new Error()
      toast.success('Notebook alocado com sucesso!')
      onRefresh()
      onClose()
    } catch {
      toast.error('Erro ao alocar.')
    } finally {
      setSavingAlocacao(false)
    }
  }

  async function desalocar() {
    setSavingAlocacao(true)
    try {
      const res = await fetch(`/api/alocacoes/notebooks/${notebook.id}/ativo`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()
      toast.success('Alocação encerrada.')
      onRefresh()
      onClose()
    } catch {
      toast.error('Erro ao desalocar.')
    } finally {
      setSavingAlocacao(false)
    }
  }

  const inp = "w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
  const lbl = "block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"

  return (
    <>
      <div className="fixed inset-0 z-50 flex">
        <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <aside className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {mode === 'edit' ? 'Editar Notebook' : (notebook.modelo || 'Notebook')}
              </h2>
              {mode === 'view' && (
                <div className="flex items-center gap-2 mt-1">
                  <CategoriaBadge categoria={notebook.categoria} />
                  {notebook.numero_patrimonio && (
                    <span className="text-xs text-slate-400">{notebook.numero_patrimonio}</span>
                  )}
                </div>
              )}
            </div>
            <button type="button" onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body — modo view */}
          {mode === 'view' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* Alocação ativa */}
              {notebook.alocacao_ativa ? (
                <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">
                        Alocação Ativa
                      </span>
                    </div>
                    <button type="button" onClick={(e) => { e.preventDefault(); setShowDesalocarConfirm(true); }}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 transition">
                      <UserMinus className="w-3.5 h-3.5" /> Desalocar
                    </button>
                  </div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    {notebook.alocacao_ativa.colaborador.nome}
                  </p>
                  {notebook.alocacao_ativa.colaborador.setor && (
                    <p className="text-xs text-green-600 dark:text-green-500">
                      {notebook.alocacao_ativa.colaborador.setor}
                    </p>
                  )}
                  {notebook.alocacao_ativa.data_inicio && (
                    <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                      Desde: {formatDate(String(notebook.alocacao_ativa.data_inicio))}
                    </p>
                  )}
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Alocar Colaborador
                    </span>
                  </div>
                  <ColaboradorSelect
                    value={colabId}
                    onChange={(id, nome) => { setColabId(id); setColabNome(nome) }}
                    onClear={() => { setColabId(''); setColabNome('') }}
                    selectedNome={colabNome}
                  />
                  {colabId && (
                    <button type="button" onClick={(e) => { e.preventDefault(); alocar(); }} disabled={savingAlocacao}
                      className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-60 transition">
                      {savingAlocacao && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Confirmar alocação
                    </button>
                  )}
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
          )}

          {/* Body — modo edit: form com id único, SEM botões de submit aqui dentro */}
          {mode === 'edit' && (
            <div className="flex-1 overflow-y-auto p-5">
              <form id="nb-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)(e); }} noValidate>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>Modelo</label><input {...register('modelo')} className={inp} /></div>
                  <div><label className={lbl}>Fabricante</label><input {...register('fabricante')} className={inp} /></div>
                  <div className="col-span-2">
                    <label className={lbl}>Categoria</label>
                    <select {...register('categoria')} className={inp}>
                      <option value="">Selecione...</option>
                      <option value="Administrativa">Administrativa</option>
                      <option value="Academica">Acadêmica</option>
                    </select>
                  </div>
                  <div><label className={lbl}>Processador</label><input {...register('processador')} className={inp} /></div>
                  <div><label className={lbl}>Memória</label><input {...register('memoria')} className={inp} /></div>
                  <div><label className={lbl}>Armazenamento</label><input {...register('armazenamento')} className={inp} /></div>
                  <div><label className={lbl}>Nº Patrimônio</label><input {...register('numero_patrimonio')} className={inp} /></div>
                  <div><label className={lbl}>Setor</label><input {...register('setor')} className={inp} /></div>
                </div>
              </form>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            {mode === 'view' ? (
              <>
                <button type="button" onClick={(e) => { e.preventDefault(); setShowDeleteConfirm(true); }}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition">
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </button>
                <button type="button" onClick={(e) => { e.preventDefault(); setMode('edit'); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition">
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={(e) => { e.preventDefault(); setMode('view'); }}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                  Cancelar
                </button>
                {/* type="submit" + form="nb-form" — única forma de disparar o handleSubmit */}
                <button type="submit" form="nb-form" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition">
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
          title="Excluir notebook"
          description={`Excluir "${notebook.modelo}"? Esta ação não pode ser desfeita.`}
          onConfirm={() => remove(notebook.id)}
          onCancel={() => setShowDeleteConfirm(false)}
          loading={deleting}
        />
      )}

      {showDesalocarConfirm && (
        <ConfirmDialog
          title="Encerrar alocação"
          description={`Desalocar "${notebook.alocacao_ativa?.colaborador.nome}" deste notebook?`}
          onConfirm={desalocar}
          onCancel={() => setShowDesalocarConfirm(false)}
          loading={savingAlocacao}
        />
      )}
    </>
  )
}