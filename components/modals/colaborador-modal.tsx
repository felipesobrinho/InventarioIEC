'use client'

import { X } from 'lucide-react'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { DetailField, DetailSection } from './detail-field'
import { formatDate } from '@/lib/utils'
import type { Colaborador } from '@/types'

interface ColaboradorModalProps {
  colaborador: Colaborador
  onClose: () => void
}

export function ColaboradorModal({ colaborador, onClose }: ColaboradorModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{colaborador.nome}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Detalhes do colaborador</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <DetailSection title="Informações Gerais">
            <DetailField label="Nome" value={colaborador.nome} />
            <DetailField label="Código" value={colaborador.codigo} />
            <DetailField label="Setor" value={colaborador.setor} />
            <DetailField label="Status" value={<StatusBadge status={colaborador.status} />} />
            <DetailField label="Cadastrado em" value={formatDate(colaborador.created_at)} />
          </DetailSection>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            Fechar
          </button>
        </div>
      </aside>
    </div>
  )
}
