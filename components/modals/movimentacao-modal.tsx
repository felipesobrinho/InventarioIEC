'use client'

import { X } from 'lucide-react'
import { DetailField, DetailSection } from '@/components/modals/detail-field'
import { formatDate, mapTipoDispositivo, mapTipoMovimentacao } from '@/lib/utils'
import type { Movimentacao } from '@/types'

export function MovimentacaoModal({ movimentacao, onClose }: { movimentacao: Movimentacao; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Movimentação</h2>
            <p className="text-sm text-slate-500 mt-0.5">{formatDate(movimentacao.data_movimentacao)}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <DetailSection title="Dispositivo">
            <DetailField label="Identificador" value={movimentacao.identificador_dispositivo} />
            <DetailField label="Tipo de Dispositivo" value={mapTipoDispositivo(movimentacao.tipo_dispositivo)} />
            <DetailField label="Tipo de Movimentação" value={mapTipoMovimentacao(movimentacao.tipo_movimentacao)} />
          </DetailSection>
          <DetailSection title="Execução">
            <DetailField label="Data" value={formatDate(movimentacao.data_movimentacao)} />
            <DetailField label="Setor" value={movimentacao.setor} />
            <DetailField label="Técnico Responsável" value={movimentacao.tecnico_responsavel} />
            <DetailField label="Colaborador" value={movimentacao.colaborador?.nome} />
          </DetailSection>
          {movimentacao.observacao && (
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Observação</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 leading-relaxed">{movimentacao.observacao}</p>
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
