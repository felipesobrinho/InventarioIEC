'use client'

import { X, User } from 'lucide-react'
import { BoolBadge } from '@/components/dashboard/status-badge'
import { DetailField, DetailSection } from '@/components/modals/detail-field'
import { formatDate, mapTipoAparelho } from '@/lib/utils'
import type { Aparelho } from '@/types'

export function AparelhoModal({ aparelho, onClose }: { aparelho: Aparelho; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{aparelho.modelo || 'Aparelho'}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{mapTipoAparelho(aparelho.tipo)}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {aparelho.alocacao_ativa && (
            <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">Alocação Ativa</span>
              </div>
              <p className="text-sm font-medium text-green-800 dark:text-green-300">{aparelho.alocacao_ativa.colaborador.nome}</p>
              {aparelho.alocacao_ativa.descricao_alocacao && <p className="text-xs text-green-600 dark:text-green-500 mt-1">{aparelho.alocacao_ativa.descricao_alocacao}</p>}
              {aparelho.alocacao_ativa.data_inicio && <p className="text-xs text-green-600 dark:text-green-500">Desde: {formatDate(aparelho.alocacao_ativa.data_inicio)}</p>}
            </div>
          )}
          <DetailSection title="Identificação">
            <DetailField label="Modelo" value={aparelho.modelo} />
            <DetailField label="Tipo" value={mapTipoAparelho(aparelho.tipo)} />
            <DetailField label="Status" value={<BoolBadge value={aparelho.status} labelTrue="Ativo" labelFalse="Inativo" />} />
            <DetailField label="Chip" value={<BoolBadge value={aparelho.chip} />} />
          </DetailSection>
          <DetailSection title="Rede">
            <DetailField label="Endereço IP" value={aparelho.endereco_ip} />
            <DetailField label="Endereço MAC" value={aparelho.endereco_mac} />
            <DetailField label="Setor" value={aparelho.setor} />
          </DetailSection>
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="w-full py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Fechar</button>
        </div>
      </aside>
    </div>
  )
}
