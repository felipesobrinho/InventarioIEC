import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const [maquinas, notebooks, aparelhos, ramais] = await Promise.all([
    prisma.maquinas.findMany({
      orderBy: { nome_host: 'asc' },
      include: {
        alocacoes: {
          where: { ativo: true },
          include: { colaborador: { select: { nome: true, setor: true } } },
        },
      },
    }),
    prisma.notebooks.findMany({
      orderBy: { modelo: 'asc' },
      include: {
        alocacoes: {
          where: { ativo: true },
          include: { colaborador: { select: { nome: true, setor: true } } },
        },
      },
    }),
    prisma.aparelhos.findMany({
      orderBy: { modelo: 'asc' },
      include: {
        alocacoes: {
          where: { ativo: true },
          include: { colaborador: { select: { nome: true, setor: true } } },
        },
      },
    }),
    prisma.ramais.findMany({
      orderBy: { numero_ramal: 'asc' },
      include: {
        alocacoes: {
          where: { ativo: true },
          include: { colaborador: { select: { nome: true, setor: true } } },
        },
      },
    }),
  ])

  function mapAlocacoes(items: any[]) {
    return items.map(item => ({
      ...item,
      alocacoes_ativas: item.alocacoes.map((a: any) => ({
        id: a.id,
        colaborador: a.colaborador,
        data_inicio: a.data_inicio,
      })),
      alocacao_ativa: item.alocacoes[0]
        ? { colaborador: item.alocacoes[0].colaborador, data_inicio: item.alocacoes[0].data_inicio }
        : null,
      alocacoes: undefined,
    }))
  }

  return NextResponse.json({
    maquinas:  mapAlocacoes(maquinas),
    notebooks: mapAlocacoes(notebooks),
    aparelhos: mapAlocacoes(aparelhos),
    ramais:    mapAlocacoes(ramais),
    gerado_em: new Date().toISOString(),
  })
}