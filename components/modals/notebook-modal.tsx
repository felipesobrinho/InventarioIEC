'use client'

import { X, User } from 'lucide-react'
import { CategoriaBadge } from '@/components/dashboard/status-badge'
import { DetailField, DetailSection } from '@/components/modals/detail-field'
import { formatDate } from '@/lib/utils'
import type { Notebook } from '@/types'

export function NotebookModal({ notebook, onClose }: { notebook: Notebook; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{notebook.modelo || 'Notebook'}</h2>
            <div className="flex items-center gap-2 mt-1">
              <CategoriaBadge categoria={notebook.categoria} />
              <span className="text-xs text-slate-400">{notebook.numero_patrimonio}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {notebook.alocacao_ativa && (
            <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">Alocação Ativa</span>
              </div>
              <p className="text-sm font-medium text-green-800 dark:text-green-300">{notebook.alocacao_ativa.colaborador.nome}</p>
              {notebook.alocacao_ativa.motivo_alocacao && <p className="text-xs text-green-600 dark:text-green-500 mt-1">Motivo: {notebook.alocacao_ativa.motivo_alocacao}</p>}
              {notebook.alocacao_ativa.tipo_posse && <p className="text-xs text-green-600 dark:text-green-500">Posse: {notebook.alocacao_ativa.tipo_posse}</p>}
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
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="w-full py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Fechar</button>
        </div>
      </aside>
    </div>
  )
}
