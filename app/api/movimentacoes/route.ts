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
  const tipoDispositivoRaw = searchParams.get('tipo_dispositivo') || ''
  const tipoMovimentacaoRaw = searchParams.get('tipo_movimentacao') || ''
  const dataInicio = searchParams.get('data_inicio') || ''
  const dataFim = searchParams.get('data_fim') || ''

  const where: any = {}
  if (search) where.identificador_dispositivo = { contains: search, mode: 'insensitive' }

  if (tipoDispositivoRaw !== '') {
    const n = parseInt(tipoDispositivoRaw)
    if (!isNaN(n)) where.tipo_dispositivo = n
  }
  if (tipoMovimentacaoRaw !== '') {
    const n = parseInt(tipoMovimentacaoRaw)
    if (!isNaN(n)) where.tipo_movimentacao = n
  }
  if (dataInicio || dataFim) {
    where.data_movimentacao = {}
    if (dataInicio) where.data_movimentacao.gte = new Date(dataInicio)
    if (dataFim) where.data_movimentacao.lte = new Date(dataFim)
  }

  const [data, total] = await Promise.all([
    prisma.movimentacoes.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: { colaborador: { select: { nome: true } } },
    }),
    prisma.movimentacoes.count({ where }),
  ])

  return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
}
