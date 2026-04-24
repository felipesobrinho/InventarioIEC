import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria, getAuditSession, descricaoDiff } from '@/lib/audit'

export const runtime = 'nodejs'
type Props = { params: Promise<{ id: string }> }

// PATCH — editar alocação ativa pelo ramal_id
export async function PATCH(request: Request, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id: ramal_id } = await params
  const { usuario_id, usuario_nome } = await getAuditSession(request)
  const body = await request.json()
  const { whatsapp, canal_adicional } = body

  const alocacaoAtiva = await prisma.alocacoes_ramais.findFirst({
    where: { ramal_id, ativo: true },
    include: { colaborador: { select: { nome: true } } },
  })

  if (!alocacaoAtiva) {
    return NextResponse.json({ error: 'Nenhuma alocação ativa encontrada' }, { status: 404 })
  }

  const anterior = { whatsapp: alocacaoAtiva.whatsapp, canal_adicional: alocacaoAtiva.canal_adicional }
  const novo: any = {}
  if (whatsapp !== undefined) novo.whatsapp = whatsapp
  if (canal_adicional !== undefined) novo.canal_adicional = canal_adicional

  const alocacao = await prisma.alocacoes_ramais.update({
    where: { id: alocacaoAtiva.id },
    data: novo,
  })

  await registrarAuditoria({
    tabela: 'alocacoes_ramais',
    registro_id: ramal_id,
    acao: 'EDITAR_ALOCACAO',
    descricao: `Alocação de ${alocacaoAtiva.colaborador?.nome ?? 'colaborador'} editada: ${descricaoDiff(anterior, novo)}`,
    dados_anteriores: anterior,
    dados_novos: novo,
    usuario_id,
    usuario_nome,
  })

  return NextResponse.json(alocacao)
}