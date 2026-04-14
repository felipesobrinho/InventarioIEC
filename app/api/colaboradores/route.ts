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
  const status = searchParams.get('status') || ''

  const where: any = {}
  if (search) where.nome = { contains: search, mode: 'insensitive' }
  if (setor) where.setor = { contains: setor, mode: 'insensitive' }
  if (status) where.status = status

  const [data, total] = await Promise.all([
    prisma.colaboradores.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { nome: 'asc' },
    }),
    prisma.colaboradores.count({ where }),
  ])

  return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
}
