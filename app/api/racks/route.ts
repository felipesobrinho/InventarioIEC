import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria, getAuditSession } from '@/lib/audit'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const marca = searchParams.get('marca') || ''

    const where: any = {}
    if (search) {
      where.OR = [
        { nome_switch: { contains: search, mode: 'insensitive' } },
        { localizacao: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (marca) where.marca_switch = { contains: marca, mode: 'insensitive' }

    const [data, total] = await Promise.all([
      prisma.racks.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { nome_switch: 'asc' },
      }),
      prisma.racks.count({ where }),
    ])

    return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('[GET /api/racks]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { usuario_id, usuario_nome } = await getAuditSession(request)
    const body = await request.json()
    const item = await prisma.racks.create({ data: body })

    await registrarAuditoria({
      tabela: 'racks',
      registro_id: item.id,
      acao: 'CREATE',
      descricao: `Rack "${item.nome_switch ?? item.id}" criado`,
      dados_novos: item as any,
      usuario_id,
      usuario_nome,
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('[POST /api/racks]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}