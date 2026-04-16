import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Props = { params: Promise<{ id: string }> }

export async function DELETE(_: Request, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id: ramal_id } = await params
  await prisma.alocacoes_ramais.updateMany({
    where: { ramal_id, ativo: true },
    data: { ativo: false, data_fim: new Date() },
  })
  return NextResponse.json({ ok: true })
}