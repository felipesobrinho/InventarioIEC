export const runtime = 'nodejs'


import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { ramal_id, colaborador_id, canal_adicional, whatsapp } = await request.json()

  if (!ramal_id || !colaborador_id) {
    return NextResponse.json({ error: 'ramal_id e colaborador_id são obrigatórios' }, { status: 400 })
  }

  await prisma.alocacoes_ramais.updateMany({
    where: { ramal_id, ativo: true },
    data: { ativo: false, data_fim: new Date() },
  })

  const alocacao = await prisma.alocacoes_ramais.create({
    data: {
      ramal_id,
      colaborador_id,
      canal_adicional: canal_adicional || null,
      whatsapp: whatsapp ?? false,
      data_inicio: new Date(),
      ativo: true,
    },
  })

  return NextResponse.json(alocacao, { status: 201 })
}
