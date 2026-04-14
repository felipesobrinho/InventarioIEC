'use client'

import { X } from 'lucide-react'
import { BoolBadge } from '@/components/dashboard/status-badge'
import { DetailField, DetailSection } from '@/components/modals/detail-field'
import { formatDate } from '@/lib/utils'
import type { Impressora } from '@/types'

export function ImpressoraModal({ impressora, onClose }: { impressora: Impressora; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{impressora.nome_host || 'Impressora'}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{impressora.fabricante} {impressora.modelo}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <DetailSection title="Identificação">
            <DetailField label="Nome Host" value={impressora.nome_host} />
            <DetailField label="Fabricante" value={impressora.fabricante} />
            <DetailField label="Modelo" value={impressora.modelo} />
            <DetailField label="Nº de Série" value={impressora.numero_serie} />
            <DetailField label="ID SELB" value={impressora.identificador_selb} />
            <DetailField label="Status" value={<BoolBadge value={impressora.status} labelTrue="Ativo" labelFalse="Inativo" />} />
          </DetailSection>
          <DetailSection title="Rede e Localização">
            <DetailField label="Endereço IP" value={impressora.endereco_ip} />
            <DetailField label="Servidor de Impressão" value={impressora.servidor_impressao} />
            <DetailField label="Localidade" value={impressora.localidade} />
            <DetailField label="Andar" value={impressora.andar} />
            <DetailField label="Tipo de Usuário" value={impressora.tipo_usuario} />
            <DetailField label="Data Revisão" value={formatDate(impressora.revisao)} />
          </DetailSection>
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="w-full py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Fechar</button>
        </div>
      </aside>
    </div>
  )
}
