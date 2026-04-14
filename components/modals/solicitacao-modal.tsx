'use client'

import { X } from 'lucide-react'
import { StatusSolicitacaoBadge, PrioridadeBadge } from '@/components/dashboard/status-badge'
import { DetailField, DetailSection } from '@/components/modals/detail-field'
import { formatDate, mapTipoSolicitacao, mapTipoDispositivo, mapOrigem } from '@/lib/utils'
import type { Solicitacao } from '@/types'

export function SolicitacaoModal({ solicitacao, onClose }: { solicitacao: Solicitacao; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Solicitação</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <StatusSolicitacaoBadge status={solicitacao.status_solicitacao} />
              <PrioridadeBadge prioridade={solicitacao.prioridade} />
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <DetailSection title="Informações">
            <DetailField label="Data" value={formatDate(solicitacao.data_criacao)} />
            <DetailField label="Solicitante" value={solicitacao.solicitante} />
            <DetailField label="Colaborador Relacionado" value={solicitacao.colaborador_relacionado} />
            <DetailField label="Origem" value={mapOrigem(solicitacao.origem_solicitacao)} />
          </DetailSection>
          <DetailSection title="Detalhes">
            <DetailField label="Tipo" value={mapTipoSolicitacao(solicitacao.tipo_solicitacao)} />
            <DetailField label="Dispositivo" value={mapTipoDispositivo(solicitacao.tipo_dispositivo)} />
            <DetailField label="Identificador" value={solicitacao.identificador_dispositivo} />
            <DetailField label="Status" value={<StatusSolicitacaoBadge status={solicitacao.status_solicitacao} />} />
            <DetailField label="Prioridade" value={<PrioridadeBadge prioridade={solicitacao.prioridade} />} />
          </DetailSection>
          {solicitacao.observacao && (
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Observação</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 leading-relaxed">{solicitacao.observacao}</p>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="w-full py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Fechar</button>
        </div>
      </aside>
    </div>
  )
}
