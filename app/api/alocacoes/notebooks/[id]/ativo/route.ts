import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Props = { params: Promise<{ id: string }> }

// DELETE /api/alocacoes/notebooks/[notebook_id]/ativo — desativa alocação ativa
export async function DELETE(_: Request, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id: notebook_id } = await params

  await prisma.alocacoes_notebooks.updateMany({
    where: { notebook_id, ativo: true },
    data: { ativo: false, data_fim: new Date() },
  })

  return NextResponse.json({ ok: true })
}