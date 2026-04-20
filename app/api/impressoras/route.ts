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
  const localidade = searchParams.get('localidade') || ''
  const andar = searchParams.get('andar') || ''
  const statusRaw = searchParams.get('status') || ''

  const where: any = {}
  if (search) {
    where.OR = [
      { nome_host: { contains: search, mode: 'insensitive' } },
      { numero_serie: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (localidade) where.localidade = { contains: localidade, mode: 'insensitive' }
  if (andar) where.andar = { contains: andar, mode: 'insensitive' }
  if (statusRaw !== '') where.status = statusRaw === 'true'

  const [data, total] = await Promise.all([
    prisma.impressoras.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { nome_host: 'asc' },
    }),
    prisma.impressoras.count({ where }),
  ])

  return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await request.json()
  const item = await prisma.impressoras.create({ data: body })
  return NextResponse.json(item, { status: 201 })
}