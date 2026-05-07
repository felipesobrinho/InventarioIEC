import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { Prisma } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria, getAuditSession, descricaoDiff } from '@/lib/audit'

export const runtime = 'nodejs'
type Props = { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  const item = await prisma.impressoras.findUnique({ where: { id }, include: {setor_rel: { select: { id: true, nome: true } },} })
  if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  
    const result = {
    ...item,
    setor_nome: item.setor_rel?.nome ?? null,
  }

  return NextResponse.json(result)
}

export async function PUT(request: Request, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  const { usuario_id, usuario_nome } = await getAuditSession(request)
  const body = await request.json() as Record<string, unknown>
  const data = { ...body } as Record<string, unknown>
  delete data.created_at
  delete data.id

  const anterior = await prisma.impressoras.findUnique({ where: { id } })
  const item = await prisma.impressoras.update({
    where: { id },
    data: data as Prisma.impressorasUncheckedUpdateInput,
  })

  await registrarAuditoria({
    tabela: 'impressoras',
    registro_id: id,
    acao: 'UPDATE',
    descricao: descricaoDiff(anterior as Record<string, unknown>, data),
    dados_anteriores: anterior as Record<string, unknown>,
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

  const anterior = await prisma.impressoras.findUnique({ where: { id } })
  await prisma.impressoras.delete({ where: { id } })

  await registrarAuditoria({
    tabela: 'impressoras',
    registro_id: id,
    acao: 'DELETE',
    descricao: `Impressora "${anterior?.nome_host ?? id}" excluída`,
    dados_anteriores: anterior as Record<string, unknown>,
    usuario_id,
    usuario_nome,
  })

  return NextResponse.json({ ok: true })
}
