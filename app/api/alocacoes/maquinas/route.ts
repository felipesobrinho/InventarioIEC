export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { maquina_id, colaborador_id, tipo_uso } = await request.json()

  if (!maquina_id || !colaborador_id) {
    return NextResponse.json({ error: 'maquina_id e colaborador_id são obrigatórios' }, { status: 400 })
  }

  await prisma.alocacoes_maquinas.updateMany({
    where: { maquina_id, ativo: true },
    data: { ativo: false, data_fim: new Date() },
  })

  const alocacao = await prisma.alocacoes_maquinas.create({
    data: { maquina_id, colaborador_id, tipo_uso: tipo_uso || null, data_inicio: new Date(), ativo: true },
  })

  return NextResponse.json(alocacao, { status: 201 })
}
