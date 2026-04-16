'use client'

import { useState } from 'react'
import { X, Pencil, Trash2, User, Loader2, UserPlus, UserMinus } from 'lucide-react'
import { toast } from 'sonner'
import { useCrud } from '@/hooks/use-crud'
import { ConfirmDialog } from '@/components/modals/confirm-dialog'
import { ColaboradorSelect } from '@/components/modals/colaborador-select'
import { DetailField, DetailSection } from '@/components/modals/detail-field'
import type { Aparelho } from '@/types'

export function AparelhoModal({ aparelho, onClose, onRefresh }: any) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [alocandoColabId, setAlocandoColabId] = useState('')
  const [alocandoColabNome, setAlocandoColabNome] = useState('')
  const [savingAlocacao, setSavingAlocacao] = useState(false)
  const [savingAlocacao, setSavingAlocacao] = useState(false)

  const { remove } = useCrud('aparelhos', () => {
    onRefresh()
    onClose()
  })

  async function handleAlocar() {
    setSavingAlocacao(true)
    const res = await fetch('/api/alocacoes/aparelhos', {
      method: 'POST',
      body: JSON.stringify({
        aparelho_id: aparelho.id,
        colaborador_id: alocandoColabId,
      }),
    })

    if (res.ok) {
      toast.success('Aparelho alocado')
      onRefresh()
      onClose()
    }
    setSavingAlocacao(false)
  }

  async function handleDesalocar() {
    setSavingAlocacao(true)
    await fetch(`/api/alocacoes/aparelhos/${aparelho.id}/ativo`, {
      method: 'DELETE',
    })

    onRefresh()
    onClose()
    setSavingAlocacao(false)
  }

  return (
    <>
      <div className="fixed inset-0 flex z-50">
        <div className="flex-1 bg-black/40" onClick={onClose} />

        <aside className="w-full max-w-md bg-white dark:bg-slate-900 flex flex-col">

          {/* HEADER */}
          <div className="p-5 flex justify-between border-b">
            <h2>{aparelho.modelo || 'Aparelho'}</h2>

            <button type="button" onClick={onClose}>
              <X />
            </button>
          </div>

          {/* BODY */}
          <div className="p-5 flex-1 overflow-y-auto">

            {/* ALOCAÇÃO */}
            {aparelho.alocacao_ativa ? (
              <>
                <p>{aparelho.alocacao_ativa.colaborador.nome}</p>

                <button type="button" onClick={(e) => { e.preventDefault(); setShowDesalocarConfirm(true); }}>
                  <UserMinus /> Desalocar
                </button>
              </>
            ) : (
              <>
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
                  <button type="button" onClick={(e) => { e.preventDefault(); handleAlocar(); }} disabled={savingAlocacao}>
                    {savingAlocacao && <Loader2 className="animate-spin" />}
                    Alocar
                  </button>
                )}
              </>
            )}

            <DetailSection title="Info">
              <DetailField label="Modelo" value={aparelho.modelo} />
            </DetailSection>
          </div>

          {/* FOOTER */}
          <div className="p-4 border-t flex gap-2">
            <button type="button" onClick={(e) => { e.preventDefault(); remove(aparelho.id); }}>
              <Trash2 /> Excluir
            </button>

            <button type="button" onClick={(e) => { e.preventDefault(); setMode('edit'); }}>
              <Pencil /> Editar
            </button>
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