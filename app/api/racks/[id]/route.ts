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
  const item = await prisma.racks.findUnique({
    where: { id },
    include: { setor_rel: { select: { id: true, nome: true } } },
  })

  if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  return NextResponse.json({
    ...item,
    setor_nome: item.setor_rel?.nome ?? item.localizacao ?? null,
    portas_livres: item.quantidade_portas != null && item.portas_em_uso != null
      ? Math.max(0, item.quantidade_portas - item.portas_em_uso)
      : null,
  })
}

export async function PUT(request: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id } = await params
    const { usuario_id, usuario_nome } = await getAuditSession()
    const body = await request.json()

    // Nunca salvar portas_livres, setor_rel, setor_nome — campos calculados/virtuais
    const { portas_livres, setor_rel, setor_nome, created_at, id: _id, ...rest } = body

    const anterior = await prisma.racks.findUnique({ where: { id } })
    if (!anterior) return NextResponse.json({ error: 'Rack não encontrado' }, { status: 404 })

    const item = await prisma.racks.update({ where: { id }, data: rest })

    await registrarAuditoria({
      tabela: 'racks',
      registro_id: id,
      acao: 'UPDATE',
      descricao: descricaoDiff(anterior as any, rest),
      dados_anteriores: anterior as any,
      dados_novos: rest,
      usuario_id,
      usuario_nome,
    })

    return NextResponse.json({
      ...item,
      setor_nome: null, // será resolvido na próxima listagem
      portas_livres: item.quantidade_portas != null && item.portas_em_uso != null
        ? Math.max(0, item.quantidade_portas - item.portas_em_uso)
        : null,
    })
  } catch (error) {
    console.error('[PUT /api/racks/[id]]', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id } = await params
    const { usuario_id, usuario_nome } = await getAuditSession(request)

    const anterior = await prisma.racks.findUnique({ where: { id } })
    await prisma.racks.delete({ where: { id } })

    await registrarAuditoria({
      tabela: 'racks',
      registro_id: id,
      acao: 'DELETE',
      descricao: `Rack "${anterior?.nome_switch ?? id}" excluído`,
      dados_anteriores: anterior as any,
      usuario_id,
      usuario_nome,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[DELETE /api/racks/[id]]', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}