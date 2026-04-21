export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const [
    colaboradores, maquinas, notebooks, aparelhos, impressoras,
    ramais, racks, solicitacoesAbertas, ultimasSolicitacoes, ultimasMovimentacoes,
  ] = await Promise.all([
    prisma.colaboradores.count({ where: { status: 'Ativo' } }),
    prisma.maquinas.count(),
    prisma.notebooks.count(),
    prisma.aparelhos.count(),
    prisma.impressoras.count(),
    prisma.ramais.count(),
    prisma.racks.count(),
    prisma.solicitacoes.count({ where: { status_solicitacao: { notIn: [4, 5] } } }),
    prisma.solicitacoes.findMany({ orderBy: { created_at: 'desc' }, take: 5 }),
    prisma.movimentacoes.findMany({
      orderBy: { created_at: 'desc' }, take: 5,
      include: { colaborador: { select: { nome: true } } },
    }),
  ])

  return NextResponse.json({
    stats: { colaboradores, maquinas, notebooks, aparelhos, impressoras, ramais, racks, solicitacoesAbertas },
    ultimasSolicitacoes,
    ultimasMovimentacoes,
  })
}

