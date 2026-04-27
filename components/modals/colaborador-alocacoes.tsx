'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Monitor, Laptop, Smartphone, Phone, Loader2, ExternalLink, ChevronRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface AlocacaoItem {
  alocacao_id: string
  data_inicio: string | null
  item: any
  tipo_uso?: number | null
  motivo_alocacao?: string | null
  whatsapp?: boolean | null
}

interface AlocacoesData {
  maquinas:  AlocacaoItem[]
  notebooks: AlocacaoItem[]
  aparelhos: AlocacaoItem[]
  ramais:    AlocacaoItem[]
}

interface Props {
  colaboradorId: string
  onNavigate: (tipo: 'maquinas' | 'notebooks' | 'aparelhos' | 'ramais', itemId: string) => void
}

const TIPO_CONFIG = {
  maquinas: {
    label: 'Máquinas',
    icon: Monitor,
    color: 'text-violet-600 dark:text-violet-400',
    bg:    'bg-violet-50 dark:bg-violet-950/40',
    border:'border-violet-100 dark:border-violet-900',
    href:  '/maquinas',
  },
  notebooks: {
    label: 'Notebooks',
    icon: Laptop,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg:    'bg-indigo-50 dark:bg-indigo-950/40',
    border:'border-indigo-100 dark:border-indigo-900',
    href:  '/notebooks',
  },
  aparelhos: {
    label: 'Aparelhos',
    icon: Smartphone,
    color: 'text-cyan-600 dark:text-cyan-400',
    bg:    'bg-cyan-50 dark:bg-cyan-950/40',
    border:'border-cyan-100 dark:border-cyan-900',
    href:  '/aparelhos',
  },
  ramais: {
    label: 'Ramais',
    icon: Phone,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg:    'bg-emerald-50 dark:bg-emerald-950/40',
    border:'border-emerald-100 dark:border-emerald-900',
    href:  '/ramais',
  },
} as const

function getItemLabel(tipo: keyof typeof TIPO_CONFIG, item: any): string {
  switch (tipo) {
    case 'maquinas':
      return item.nome_host ?? item.identificador ?? '—'
    case 'notebooks':
      return item.numero_patrimonio ?? item.modelo ?? '—'
    case 'aparelhos':
      return item.modelo ?? '—'
    case 'ramais':
      return item.numero_ramal != null ? `Ramal ${item.numero_ramal}` : '—'
  }
}

function getItemSub(tipo: keyof typeof TIPO_CONFIG, item: any): string {
  switch (tipo) {
    case 'maquinas':
      return [item.fabricante, item.modelo].filter(Boolean).join(' ') || item.setor || ''
    case 'notebooks':
      return [item.fabricante, item.modelo].filter(Boolean).join(' ') || ''
    case 'aparelhos':
      return item.setor || ''
    case 'ramais':
      return item.nome_setor || ''
  }
}

function AlocacaoCard({
  tipo,
  aloc,
  onNavigate,
}: {
  tipo: keyof typeof TIPO_CONFIG
  aloc: AlocacaoItem
  onNavigate: Props['onNavigate']
}) {
  const cfg = TIPO_CONFIG[tipo]
  const Icon = cfg.icon
  const label = getItemLabel(tipo, aloc.item)
  const sub   = getItemSub(tipo, aloc.item)

  return (
    <button
      type="button"
      onClick={() => onNavigate(tipo, aloc.item.id)}
      className={`
        w-full text-left flex items-center gap-3 p-3 rounded-lg border
        ${cfg.bg} ${cfg.border}
        hover:opacity-80 transition group
      `}
    >
      {/* Ícone */}
      <div className={`w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
          {label}
        </p>
        {sub && (
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{sub}</p>
        )}
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {aloc.data_inicio && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Desde {formatDate(aloc.data_inicio)}
            </span>
          )}
          {tipo === 'ramais' && aloc.whatsapp && (
            <span className="text-[11px] bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full">
              WhatsApp
            </span>
          )}
          {tipo === 'notebooks' && aloc.motivo_alocacao && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
              {aloc.motivo_alocacao}
            </span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition shrink-0" />
    </button>
  )
}

export function ColaboradorAlocacoes({ colaboradorId, onNavigate }: Props) {
  const [data, setData] = useState<AlocacoesData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetch(`/api/colaboradores/${colaboradorId}/alocacoes`)
      .then(r => r.json())
      .then(json => {
        if (!cancelled) setData(json)
      })
      .catch(err => console.error('[ColaboradorAlocacoes]', err))
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [colaboradorId])

  const total = data
    ? data.maquinas.length + data.notebooks.length + data.aparelhos.length + data.ramais.length
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    )
  }

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-center">
        <ExternalLink className="w-8 h-8 mb-2 opacity-30" />
        <p className="text-sm">Nenhum item alocado a este colaborador.</p>
      </div>
    )
  }

  const tipos = (['maquinas', 'notebooks', 'aparelhos', 'ramais'] as const).filter(
    t => data![t].length > 0
  )

  return (
    <div className="space-y-4">
      {tipos.map(tipo => (
        <div key={tipo}>
          <div className="flex items-center gap-2 mb-2">
            {(() => {
              const Icon = TIPO_CONFIG[tipo].icon
              return <Icon className={`w-3.5 h-3.5 ${TIPO_CONFIG[tipo].color}`} />
            })()}
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {TIPO_CONFIG[tipo].label}
            </span>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {data![tipo].length}
            </span>
          </div>
          <div className="space-y-2">
            {data![tipo].map(aloc => (
              <AlocacaoCard
                key={aloc.alocacao_id}
                tipo={tipo}
                aloc={aloc}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}