'use client'

import { X, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreate } from '@/hooks/use-create'
import { optionalInt } from '@/lib/zod-helpers'

const schema = z.object({
  nome_switch: z.string().optional().nullable(),
  marca_switch: z.string().optional().nullable(),
  localizacao: z.string().optional().nullable(),
  numero_patrimonio: z.string().optional().nullable(),
  quantidade_portas: optionalInt,
  portas_em_uso: optionalInt,
  portas_livres: optionalInt,
})

type FormData = z.infer<typeof schema>

interface Props { onClose: () => void; onRefresh: () => void }

export function CriarRackModal({ onClose, onRefresh }: Props) {
  const { create, saving } = useCreate('racks', () => { onRefresh(); onClose() })
  const { register, handleSubmit } = useForm<FormData>({ resolver: zodResolver(schema) as any })

  const inp = "w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
  const lbl = "block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Novo Rack</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <form id="criar-rack-form" onSubmit={handleSubmit(create)} noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Nome Switch</label><input {...register('nome_switch')} className={inp} /></div>
              <div><label className={lbl}>Marca</label><input {...register('marca_switch')} className={inp} /></div>
              <div><label className={lbl}>Localização</label><input {...register('localizacao')} className={inp} /></div>
              <div><label className={lbl}>Nº Patrimônio</label><input {...register('numero_patrimonio')} className={inp} /></div>
              <div><label className={lbl}>Total de Portas</label><input type="number" {...register('quantidade_portas')} className={inp} /></div>
              <div><label className={lbl}>Portas em Uso</label><input type="number" {...register('portas_em_uso')} className={inp} /></div>
              <div><label className={lbl}>Portas Livres</label><input type="number" {...register('portas_livres')} className={inp} /></div>
            </div>
          </form>
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Cancelar</button>
          <button type="submit" form="criar-rack-form" disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Criar rack
          </button>
        </div>
      </aside>
    </div>
  )
}