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
  // status e prioridade são Int no banco
  const statusRaw = searchParams.get('status') || ''
  const prioridadeRaw = searchParams.get('prioridade') || ''
  const tipoSolicitacaoRaw = searchParams.get('tipo_solicitacao') || ''
  const dataInicio = searchParams.get('data_inicio') || ''
  const dataFim = searchParams.get('data_fim') || ''

  const where: any = {}

  if (statusRaw !== '') {
    const n = parseInt(statusRaw)
    if (!isNaN(n)) where.status_solicitacao = n
  }
  if (prioridadeRaw !== '') {
    const n = parseInt(prioridadeRaw)
    if (!isNaN(n)) where.prioridade = n
  }
  if (tipoSolicitacaoRaw !== '') {
    const n = parseInt(tipoSolicitacaoRaw)
    if (!isNaN(n)) where.tipo_solicitacao = n
  }
  if (dataInicio || dataFim) {
    where.data_criacao = {}
    if (dataInicio) where.data_criacao.gte = new Date(dataInicio)
    if (dataFim) where.data_criacao.lte = new Date(dataFim)
  }

  const [data, total] = await Promise.all([
    prisma.solicitacoes.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.solicitacoes.count({ where }),
  ])

  return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
}
