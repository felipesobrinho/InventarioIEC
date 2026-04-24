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
  } catch (error) {
    console.error('[GET /api/colaboradores]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { usuario_id, usuario_nome } = await getAuditSession(request)
    const body = await request.json()
    const item = await prisma.colaboradores.create({ data: body })

    await registrarAuditoria({
      tabela: 'colaboradores',
      registro_id: item.id,
      acao: 'CREATE',
      descricao: `Colaborador "${item.nome}" criado`,
      dados_novos: item as any,
      usuario_id,
      usuario_nome,
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('[POST /api/colaboradores]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}