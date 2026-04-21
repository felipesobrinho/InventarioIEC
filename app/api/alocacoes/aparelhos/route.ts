export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { aparelho_id, colaborador_id, descricao_alocacao, motivo_alocacao } = await request.json()

  if (!aparelho_id || !colaborador_id) {
    return NextResponse.json({ error: 'aparelho_id e colaborador_id são obrigatórios' }, { status: 400 })
  }

  await prisma.alocacoes_aparelhos.updateMany({
    where: { aparelho_id, ativo: true },
    data: { ativo: false, data_fim: new Date() },
  })

  const alocacao = await prisma.alocacoes_aparelhos.create({
    data: {
      aparelho_id, colaborador_id,
      descricao_alocacao: descricao_alocacao || null,
      motivo_alocacao: motivo_alocacao || null,
      data_inicio: new Date(), ativo: true,
    },
  })

  return NextResponse.json(alocacao, { status: 201 })
}
