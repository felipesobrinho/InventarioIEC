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

export function MaquinaModal({ maquina, onClose, onRefresh }: {
  maquina: Maquina
  onClose: () => void
  onRefresh: () => void
}) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [showConfirm, setShowConfirm] = useState(false)
  const [showDesalocarConfirm, setShowDesalocarConfirm] = useState(false)
  const [alocandoColabId, setAlocandoColabId] = useState('')
  const [alocandoColabNome, setAlocandoColabNome] = useState('')
  const [savingAlocacao, setSavingAlocacao] = useState(false)

  const { update, remove, saving, deleting } = useCrud('maquinas', () => {
    onRefresh()
    onClose()
  })

  const { register, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: maquina,
  })

  async function handleAlocar() {
    if (!alocandoColabId) return
    setSavingAlocacao(true)
    try {
      const res = await fetch('/api/alocacoes/maquinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maquina_id: maquina.id, colaborador_id: alocandoColabId }),
      })
      if (!res.ok) throw new Error()
      toast.success('Máquina alocada com sucesso!')
      onRefresh()
      onClose()
    } catch {
      toast.error('Erro ao alocar máquina.')
    } finally {
      setSavingAlocacao(false)
    }
  }

  async function handleDesalocar() {
    setSavingAlocacao(true)
    try {
      const res = await fetch(`/api/alocacoes/maquinas/${maquina.id}/ativo`, {
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

  const i = "w-full px-3 py-2 text-sm border rounded-lg"
  const l = "text-xs mb-1 block"

  return (
    <>
      <div className="fixed inset-0 z-50 flex">
        <div className="flex-1 bg-black/40" onClick={onClose} />

        <aside className="w-full max-w-md bg-white dark:bg-slate-900 flex flex-col">

          {/* HEADER */}
          <div className="p-5 flex justify-between border-b">
            <h2>
              {mode === 'edit' ? 'Editar Máquina' : (maquina.nome_host || 'Máquina')}
            </h2>

            <button type="button" onClick={onClose}>
              <X />
            </button>
          </div>

          {/* BODY */}
          <div className="p-5 overflow-y-auto flex-1">
            {mode === 'view' ? (
              <>
                {/* ALOCAÇÃO */}
                {maquina.alocacao_ativa ? (
                  <div>
                    <p>{maquina.alocacao_ativa.colaborador.nome}</p>

                    <button type="button" onClick={() => setShowDesalocarConfirm(true)}>
                      <UserMinus /> Desalocar
                    </button>
                  </div>
                ) : (
                  <div>
                    <ColaboradorSelect
                      value={alocandoColabId}
                      onChange={(id, nome) => {
                        setAlocandoColabId(id)
                        setAlocandoColabNome(nome)
                      }}
                      onClear={() => setAlocandoColabId('')}
                      selectedNome={alocandoColabNome}
                    />

                    {alocandoColabId && (
                      <button type="button" onClick={handleAlocar}>
                        {savingAlocacao && <Loader2 className="animate-spin" />}
                        Alocar
                      </button>
                    )}
                  </div>
                )}

                <DetailSection title="Identificação">
                  <DetailField label="Host" value={maquina.nome_host} />
                </DetailSection>
              </>
            ) : (
              <form
                id="maquina-edit-form"
                onSubmit={handleSubmit((d) => update(maquina.id, d))}
              >
                <input {...register('nome_host')} className={i} />
              </form>
            )}
          </div>

          {/* FOOTER */}
          <div className="p-4 flex gap-2 border-t">
            {mode === 'view' ? (
              <>
                <button type="button" onClick={() => setShowConfirm(true)}>
                  <Trash2 /> Excluir
                </button>

                <button type="button" onClick={() => setMode('edit')}>
                  <Pencil /> Editar
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setMode('view')}>
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={saving}
                >
                  {saving && <Loader2 className="animate-spin" />}
                  Salvar
                </button>
              </>
            )}
          </div>
        </aside>
      </div>

      {showDesalocarConfirm && (
        <ConfirmDialog
          title="Desalocar"
          description="Confirmar?"
          onConfirm={handleDesalocar}
          onCancel={() => setShowDesalocarConfirm(false)}
          loading={savingAlocacao}
        />
      )}
    </>
  )
}