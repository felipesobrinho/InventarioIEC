export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { notebook_id, colaborador_id, motivo_alocacao, tipo_posse } = await request.json()

  if (!notebook_id || !colaborador_id) {
    return NextResponse.json({ error: 'notebook_id e colaborador_id são obrigatórios' }, { status: 400 })
  }

  await prisma.alocacoes_notebooks.updateMany({
    where: { notebook_id, ativo: true },
    data: { ativo: false, data_fim: new Date() },
  })

  const alocacao = await prisma.alocacoes_notebooks.create({
    data: {
      notebook_id,
      colaborador_id,
      motivo_alocacao: motivo_alocacao || null,
      tipo_posse: tipo_posse || null,
      data_inicio: new Date(),
      ativo: true,
    },
  })

  return NextResponse.json(alocacao, { status: 201 })
}
