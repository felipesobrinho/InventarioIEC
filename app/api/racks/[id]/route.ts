import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
export const runtime = 'nodejs'

type Props = { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  const item = await prisma.racks.findUnique({ where: { id } })
  if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(item)
}

export async function PUT(request: Request, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  const body = await request.json()
  // Remover campos não editáveis
  const { created_at, id: _id, ...data } = body
  const item = await prisma.racks.update({ where: { id }, data })
  return NextResponse.json(item)
}

export async function DELETE(_: Request, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  await prisma.racks.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}