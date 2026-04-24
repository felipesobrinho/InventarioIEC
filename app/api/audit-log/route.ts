import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '30')
  const tabela = searchParams.get('tabela') || ''
  const acao = searchParams.get('acao') || ''
  const usuario = searchParams.get('usuario') || ''
  const registro_id = searchParams.get('registro_id') || ''

  const where: any = {}
  if (tabela) where.tabela = tabela
  if (acao) where.acao = acao
  if (usuario) where.usuario_nome = { contains: usuario, mode: 'insensitive' }
  if (registro_id) where.registro_id = registro_id

  const [data, total] = await Promise.all([
    prisma.audit_log.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.audit_log.count({ where }),
  ])

  return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
}