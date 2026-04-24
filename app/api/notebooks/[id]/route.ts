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
  const item = await prisma.notebooks.findUnique({ where: { id } })
  if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(item)
}

export async function PUT(request: Request, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  const { usuario_id, usuario_nome } = await getAuditSession(request)
  const body = await request.json()
  const { alocacoes, alocacao_ativa, created_at, id: _id, ...data } = body

  const anterior = await prisma.notebooks.findUnique({ where: { id } })
  const item = await prisma.notebooks.update({ where: { id }, data })

  await registrarAuditoria({
    tabela: 'notebooks',
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

  const anterior = await prisma.notebooks.findUnique({ where: { id } })
  await prisma.notebooks.delete({ where: { id } })

  await registrarAuditoria({
    tabela: 'notebooks',
    registro_id: id,
    acao: 'DELETE',
    descricao: `Notebook "${anterior?.modelo ?? id}" excluído`,
    dados_anteriores: anterior as any,
    usuario_id,
    usuario_nome,
  })

  return NextResponse.json({ ok: true })
}