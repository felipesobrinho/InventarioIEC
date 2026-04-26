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
    const localidade = searchParams.get('localidade') || ''
    const andar = searchParams.get('andar') || ''
    const statusRaw = searchParams.get('status') || ''
    const sortBy = searchParams.get('sort') || 'created_at'
    const sortDir = searchParams.get('dir') === 'asc' ? 'asc' : ('desc' as const)

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
    const validSort: Record<string, boolean> = {
      nome: true, created_at: true, codigo: true, setor: true,
    }
    const safeSort = validSort[sortBy] ? sortBy : 'nome'

    const [data, total] = await Promise.all([
      prisma.impressoras.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [safeSort]: sortDir },
      }),
      prisma.impressoras.count({ where }),
    ])

    return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('[GET /api/impressoras]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { usuario_id, usuario_nome } = await getAuditSession(request)
    const body = await request.json()
    const item = await prisma.impressoras.create({ data: body })

    await registrarAuditoria({
      tabela: 'impressoras',
      registro_id: item.id,
      acao: 'CREATE',
      descricao: `Impressora "${item.nome_host ?? item.numero_serie ?? item.id}" criada`,
      dados_novos: item as any,
      usuario_id,
      usuario_nome,
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('[POST /api/impressoras]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}