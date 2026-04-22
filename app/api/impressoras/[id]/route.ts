import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
export const runtime = 'nodejs'

type Props = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  const item = await prisma.impressoras.findUnique({ where: { id } })
  if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(item)
}

export async function PUT(request: NextRequest, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  const body = await request.json()
  const { created_at, ...data } = body
  const item = await prisma.impressoras.update({ where: { id }, data })
  return NextResponse.json(item)
}

export async function DELETE(request: NextRequest, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  await prisma.impressoras.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}