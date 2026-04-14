import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const setor = searchParams.get('setor') || ''
  const statusRaw = searchParams.get('status') || ''
  const chipRaw = searchParams.get('chip') || ''

  const where: any = {}
  if (search) where.modelo = { contains: search, mode: 'insensitive' }
  if (setor) where.setor = { contains: setor, mode: 'insensitive' }
  if (statusRaw !== '') where.status = statusRaw === 'true'
  if (chipRaw !== '') where.chip = chipRaw === 'true'

  const [data, total] = await Promise.all([
    prisma.aparelhos.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { modelo: 'asc' },
      include: {
        alocacoes: {
          where: { ativo: true },
          take: 1,
          include: { colaborador: { select: { nome: true, setor: true } } },
        },
      },
    }),
    prisma.aparelhos.count({ where }),
  ])

  const mapped = data.map((a: any) => ({
    ...a,
    alocacao_ativa: a.alocacoes[0]
      ? {
          colaborador: a.alocacoes[0].colaborador,
          descricao_alocacao: a.alocacoes[0].descricao_alocacao,
          motivo_alocacao: a.alocacoes[0].motivo_alocacao,
          data_inicio: a.alocacoes[0].data_inicio,
        }
      : null,
    alocacoes: undefined,
  }))

  return NextResponse.json({ data: mapped, total, page, totalPages: Math.ceil(total / limit) })
}
