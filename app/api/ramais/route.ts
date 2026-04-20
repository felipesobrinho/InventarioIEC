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
  const disponibilidade = searchParams.get('disponibilidade') || ''
  const fila = searchParams.get('fila') || ''

  const where: any = {}
  if (search) {
    const numSearch = parseInt(search)
    where.OR = [
      { nome_setor: { contains: search, mode: 'insensitive' } },
      ...(!isNaN(numSearch) ? [{ numero_ramal: numSearch }] : []),
    ]
  }
  if (disponibilidade) where.disponibilidade = { contains: disponibilidade, mode: 'insensitive' }
  if (fila !== '') where.fila = fila === 'true'

  const [data, total] = await Promise.all([
    prisma.ramais.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { numero_ramal: 'asc' },
      include: {
        alocacoes: {
          where: { ativo: true },
          take: 1,
          include: { colaborador: { select: { nome: true, setor: true } } },
        },
      },
    }),
    prisma.ramais.count({ where }),
  ])

  const mapped = data.map((r: any) => ({
    ...r,
    alocacao_ativa: r.alocacoes[0]
      ? {
          colaborador: r.alocacoes[0].colaborador,
          tipo_base: r.alocacoes[0].tipo_base,
          whatsapp: r.alocacoes[0].whatsapp,
          data_inicio: r.alocacoes[0].data_inicio,
        }
      : null,
    alocacoes: undefined,
  }))

  return NextResponse.json({ data: mapped, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await request.json()
  const item = await prisma.ramais.create({ data: body })
  return NextResponse.json(item, { status: 201 })
}