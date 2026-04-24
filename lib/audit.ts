import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'ALOCAR'
  | 'DESALOCAR'
  | 'EDITAR_ALOCACAO'

export const TABELA_LABELS: Record<string, string> = {
  maquinas: 'Máquinas',
  notebooks: 'Notebooks',
  aparelhos: 'Aparelhos',
  impressoras: 'Impressoras',
  ramais: 'Ramais',
  racks: 'Racks',
  colaboradores: 'Colaboradores',
  solicitacoes: 'Solicitações',
  alocacoes_maquinas: 'Alocações de Máquinas',
  alocacoes_notebooks: 'Alocações de Notebooks',
  alocacoes_aparelhos: 'Alocações de Aparelhos',
  alocacoes_ramais: 'Alocações de Ramais',
}

interface AuditParams {
  tabela: string
  registro_id: string
  acao: AuditAction
  descricao?: string
  dados_anteriores?: Record<string, any> | null
  dados_novos?: Record<string, any> | null
  usuario_id?: string
  usuario_nome?: string
}

export async function registrarAuditoria(params: AuditParams) {
  try {
    await prisma.audit_log.create({
      data: {
        tabela: params.tabela,
        registro_id: params.registro_id,
        acao: params.acao,
        descricao: params.descricao ?? null,
        dados_anteriores: params.dados_anteriores ?? undefined,
        dados_novos: params.dados_novos ?? undefined,
        usuario_id: params.usuario_id ?? null,
        usuario_nome: params.usuario_nome ?? null,
      },
    })
  } catch (err) {
    // Nunca deixar o log quebrar a operação principal
    console.error('[audit]', err)
  }
}

export async function getAuditSession(request: Request) {
  const session = await getServerSession(authOptions)
  return {
    usuario_id: (session?.user as any)?.id ?? null,
    usuario_nome: (session?.user as any)?.name ?? 'Desconhecido',
  }
}

// Gerar descrição legível da diferença entre dois objetos
export function descricaoDiff(
  anterior: Record<string, any>,
  novo: Record<string, any>
): string {
  const mudancas: string[] = []
  const camposIgnorados = ['created_at', 'updated_at', 'id']

  for (const key of Object.keys(novo)) {
    if (camposIgnorados.includes(key)) continue
    if (JSON.stringify(anterior[key]) !== JSON.stringify(novo[key])) {
      mudancas.push(`${key}: "${anterior[key] ?? '—'}" → "${novo[key] ?? '—'}"`)
    }
  }

  return mudancas.length > 0 ? mudancas.join(', ') : 'Sem alterações detectadas'
}