'use client'

import { useState } from 'react'
import { User, UserMinus, UserPlus, Loader2, Pencil, Check, X as XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { ColaboradorSelect } from '@/components/modals/colaborador-select'
import { ConfirmDialog } from '@/components/modals/confirm-dialog'
import { formatDate } from '@/lib/utils'

interface AlocacaoItem {
  id: string
  colaborador: { nome: string; setor: string | null }
  data_inicio: string | null
  whatsapp?: boolean | null    // apenas ramais
  extra?: React.ReactNode      // slot para campos específicos
}

interface Props {
  itemId: string
  entidade: 'maquinas' | 'notebooks' | 'aparelhos' | 'ramais'
  alocacoes: AlocacaoItem[]
  onRefresh: () => void
  onClose: () => void
  // Campos extras por entidade (ex: whatsapp no ramal)
  renderExtraForm?: (alocacaoId: string) => React.ReactNode
}

export function AlocacoesAtivasSection({
  itemId,
  entidade,
  alocacoes,
  onRefresh,
  onClose,
  renderExtraForm,
}: Props) {
  const [novoColabId, setNovoColabId] = useState('')
  const [novoColabNome, setNovoColabNome] = useState('')
  const [savingNova, setSavingNova] = useState(false)
  const [desalocandoId, setDesalocandoId] = useState<string | null>(null)
  const [confirmDesalocar, setConfirmDesalocar] = useState<AlocacaoItem | null>(null)

  // Alocar novo colaborador
  async function alocar() {
    if (!novoColabId) return
    setSavingNova(true)
    try {
      const bodyMap: Record<string, any> = {
        maquinas:  { maquina_id:  itemId, colaborador_id: novoColabId },
        notebooks: { notebook_id: itemId, colaborador_id: novoColabId },
        aparelhos: { aparelho_id: itemId, colaborador_id: novoColabId },
        ramais:    { ramal_id:    itemId, colaborador_id: novoColabId },
      }
      const res = await fetch(`/api/alocacoes/${entidade}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyMap[entidade]),
      })
      if (!res.ok) throw new Error()
      toast.success('Colaborador alocado!')
      setNovoColabId('')
      setNovoColabNome('')
      onRefresh()
    } catch {
      toast.error('Erro ao alocar.')
    } finally {
      setSavingNova(false)
    }
  }

  // Desalocar colaborador específico pelo ID da alocação
  async function desalocar(alocacaoId: string) {
    setDesalocandoId(alocacaoId)
    try {
      const res = await fetch(`/api/alocacoes/${entidade}/${alocacaoId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()
      toast.success('Alocação encerrada.')
      onRefresh()
    } catch {
      toast.error('Erro ao desalocar.')
    } finally {
      setDesalocandoId(null)
      setConfirmDesalocar(null)
    }
  }

  return (
    <div className="space-y-3">
      {/* Lista de alocações ativas */}
      {alocacoes.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-2">Nenhuma alocação ativa.</p>
      ) : (
        alocacoes.map((aloc) => (
          <div
            key={aloc.id}
            className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 rounded-lg p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <User className="w-3.5 h-3.5 text-green-600 dark:text-green-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300 truncate">
                    {aloc.colaborador.nome}
                  </p>
                  {aloc.colaborador.setor && (
                    <p className="text-xs text-green-600 dark:text-green-500">{aloc.colaborador.setor}</p>
                  )}
                  {aloc.data_inicio && (
                    <p className="text-xs text-green-500 dark:text-green-600">
                      Desde: {formatDate(aloc.data_inicio)}
                    </p>
                  )}
                  {/* Campos extras (ex: whatsapp) */}
                  {aloc.whatsapp !== undefined && (
                    <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
                      WhatsApp: {aloc.whatsapp ? 'Sim' : 'Não'}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmDesalocar(aloc)}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 transition shrink-0"
              >
                {desalocandoId === aloc.id
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <UserMinus className="w-3.5 h-3.5" />
                }
                Desalocar
              </button>
            </div>
            {/* Slot para edição extra (ex: checkbox whatsapp) */}
            {renderExtraForm?.(aloc.id)}
          </div>
        ))
      )}

      {/* Adicionar nova alocação */}
      <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2">
          <UserPlus className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Adicionar colaborador
          </span>
        </div>
        <ColaboradorSelect
          value={novoColabId}
          onChange={(id, nome) => { setNovoColabId(id); setNovoColabNome(nome) }}
          onClear={() => { setNovoColabId(''); setNovoColabNome('') }}
          selectedNome={novoColabNome}
        />
        {novoColabId && (
          <button
            type="button"
            onClick={alocar}
            disabled={savingNova}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-60 transition"
          >
            {savingNova && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Confirmar alocação
          </button>
        )}
      </div>

      {/* Confirm desalocar */}
      {confirmDesalocar && (
        <ConfirmDialog
          title="Encerrar alocação"
          description={`Desalocar "${confirmDesalocar.colaborador.nome}"?`}
          onConfirm={() => desalocar(confirmDesalocar.id)}
          onCancel={() => setConfirmDesalocar(null)}
          loading={desalocandoId === confirmDesalocar.id}
        />
      )}
    </div>
  )
}