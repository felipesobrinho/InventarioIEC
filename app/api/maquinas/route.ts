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
  const categoria = searchParams.get('categoria') || ''
  const fabricante = searchParams.get('fabricante') || ''

  const where: any = {}
  if (search) {
    where.OR = [
      { nome_host: { contains: search, mode: 'insensitive' } },
      { identificador: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (setor) where.setor = { contains: setor, mode: 'insensitive' }
  if (categoria) where.categoria = categoria
  if (fabricante) where.fabricante = { contains: fabricante, mode: 'insensitive' }

  const [data, total] = await Promise.all([
    prisma.maquinas.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { nome_host: 'asc' },
      include: {
        alocacoes: {
          where: { ativo: true },
          take: 1,
          include: { colaborador: { select: { nome: true, setor: true } } },
        },
      },
    }),
    prisma.maquinas.count({ where }),
  ])

  const mapped = data.map((m: any) => ({
    ...m,
    alocacao_ativa: m.alocacoes[0]
      ? {
          colaborador: m.alocacoes[0].colaborador,
          tipo_uso: m.alocacoes[0].tipo_uso,
          data_inicio: m.alocacoes[0].data_inicio,
        }
      : null,
    alocacoes: undefined,
  }))

  return NextResponse.json({ data: mapped, total, page, totalPages: Math.ceil(total / limit) })
}
