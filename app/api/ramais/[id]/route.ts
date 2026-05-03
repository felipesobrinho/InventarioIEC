import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria, getAuditSession, descricaoDiff } from '@/lib/audit'

export const runtime = 'nodejs'
type Props = { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const item = await prisma.ramais.findUnique({
    where: { id },
    include: {
      alocacoes: {
        where: { ativo: true },
        include: { colaborador: { select: { nome: true, setor: true } } },
        orderBy: { data_inicio: 'asc' },
      },
      setor_rel: { select: { id: true, nome: true } },
    },
  })

  if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const result = {
    ...item,
    alocacoes_ativas: item.alocacoes.map((a: any) => ({
      id: a.id,
      colaborador: a.colaborador,
      tipo_base: a.tipo_base,
      whatsapp: a.whatsapp,
      canal_adicional: a.canal_adicional,
      data_inicio: a.data_inicio,
    })),
    alocacao_ativa: item.alocacoes[0]
      ? {
          colaborador: item.alocacoes[0].colaborador,
          tipo_base: item.alocacoes[0].tipo_base,
          whatsapp: item.alocacoes[0].whatsapp,
          data_inicio: item.alocacoes[0].data_inicio,
        }
      : null,
    alocacoes: undefined,
    setor_nome: item.setor_rel?.nome ?? item.nome_setor ?? null, // ← adicionar
  }

  return NextResponse.json(result)
}

export async function PUT(request: Request, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  const { usuario_id, usuario_nome } = await getAuditSession(request)
  const body = await request.json()
  const { created_at, id: _id, alocacoes, alocacao_ativa, ...data } = body

  const anterior = await prisma.ramais.findUnique({ where: { id } })
  const item = await prisma.ramais.update({ where: { id }, data })

  await registrarAuditoria({
    tabela: 'ramais',
    registro_id: id,
    acao: 'UPDATE',
    descricao: descricaoDiff(anterior as any, data),
    dados_anteriores: anterior as any,
    dados_novos: data,
    usuario_id,
    usuario_nome,
  })

  return NextResponse.json(item)
}

export async function DELETE(request: Request, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  const { usuario_id, usuario_nome } = await getAuditSession(request)

  const anterior = await prisma.ramais.findUnique({ where: { id } })
  await prisma.ramais.delete({ where: { id } })

  await registrarAuditoria({
    tabela: 'ramais',
    registro_id: id,
    acao: 'DELETE',
    descricao: `Ramal "${anterior?.numero_ramal ?? id}" excluído`,
    dados_anteriores: anterior as any,
    usuario_id,
    usuario_nome,
  })

  return NextResponse.json({ ok: true })
}