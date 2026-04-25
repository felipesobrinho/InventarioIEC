import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const [
    colaboradores,
    maquinas,
    notebooks,
    aparelhos,
    impressoras,
    ramais,
    racks,
    solicitacoesAbertas,
    maquinasAlocadas,
    notebooksAlocados,
    aparelhosAlocados,
    ramaisAlocados,
    ultimasSolicitacoes,
    ultimasMovimentacoes,
  ] = await Promise.all([
    prisma.colaboradores.count({ where: { status: 'Ativo' } }),
    prisma.maquinas.count(),
    prisma.notebooks.count(),
    prisma.aparelhos.count(),
    prisma.impressoras.count(),
    prisma.ramais.count(),
    prisma.racks.count(),
    prisma.solicitacoes.count({ where: { status_solicitacao: { notIn: [4, 5] } } }),
    // Contagem de itens com alocação ativa
    prisma.alocacoes_maquinas.count({ where: { ativo: true } }),
    prisma.alocacoes_notebooks.count({ where: { ativo: true } }),
    prisma.alocacoes_aparelhos.count({ where: { ativo: true } }),
    prisma.alocacoes_ramais.count({ where: { ativo: true } }),
    prisma.solicitacoes.findMany({ orderBy: { created_at: 'desc' }, take: 5 }),
    prisma.movimentacoes.findMany({
      orderBy: { created_at: 'desc' }, take: 5,
      include: { colaborador: { select: { nome: true } } },
    }),
  ])

  return NextResponse.json({
    stats: {
      colaboradores,
      maquinas,
      notebooks,
      aparelhos,
      impressoras,
      ramais,
      racks,
      solicitacoesAbertas,
      maquinasAlocadas,
      notebooksAlocados,
      aparelhosAlocados,
      ramaisAlocados,
    },
    ultimasSolicitacoes,
    ultimasMovimentacoes,
  })
}