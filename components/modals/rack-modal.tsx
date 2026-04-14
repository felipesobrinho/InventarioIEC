'use client'

import { X } from 'lucide-react'
import { DetailField, DetailSection } from '@/components/modals/detail-field'
import type { Rack } from '@/types'

export function RackModal({ rack, onClose }: { rack: Rack; onClose: () => void }) {
  const usoPct = rack.quantidade_portas && rack.portas_em_uso
    ? Math.round((rack.portas_em_uso / rack.quantidade_portas) * 100)
    : null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{rack.nome_switch || 'Rack'}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{rack.marca_switch} — {rack.localizacao}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {usoPct !== null && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <div className="flex justify-between text-xs text-slate-500 mb-2">
                <span>Uso de portas</span>
                <span className="font-semibold">{usoPct}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all ${usoPct > 80 ? 'bg-red-500' : usoPct > 60 ? 'bg-amber-500' : 'bg-green-500'}`}
                  style={{ width: `${usoPct}%` }} />
              </div>
            </div>
          )}
          <DetailSection title="Identificação">
            <DetailField label="Nome Switch" value={rack.nome_switch} />
            <DetailField label="Marca" value={rack.marca_switch} />
            <DetailField label="Localização" value={rack.localizacao} />
            <DetailField label="Nº Patrimônio" value={rack.numero_patrimonio} />
          </DetailSection>
          <DetailSection title="Portas">
            <DetailField label="Total de Portas" value={rack.quantidade_portas} />
            <DetailField label="Portas em Uso" value={rack.portas_em_uso} />
            <DetailField label="Portas Livres" value={rack.portas_livres} />
            <DetailField label="Portas Acadêmicas" value={rack.portas_academicas} />
            <DetailField label="Portas VLAN Impressoras" value={rack.portas_vlan_impressoras} />
          </DetailSection>
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="w-full py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Fechar</button>
        </div>
      </aside>
    </div>
  )
}
