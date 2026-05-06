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
    const page    = Math.max(1, parseInt(searchParams.get('page')  || '1', 10))
    const limit   = Math.max(1, Math.min(10000, parseInt(searchParams.get('limit') || '20', 10)))
    const search  = (searchParams.get('search') || '').trim()
    const setorId = searchParams.get('setor_id') || ''
    const sort    = searchParams.get('sort') || 'nome_switch'
    const dir     = searchParams.get('dir') === 'desc' ? 'desc' : 'asc'

    const validSortFields: Record<string, boolean> = {
      nome_switch: true, marca_switch: true,
      localizacao: true, created_at: true,
    }
    const safeSort = validSortFields[sort] ? sort : 'nome_switch'

    const AND: any[] = []

    if (search) {
      AND.push({
        OR: [
          { nome_switch:    { contains: search, mode: 'insensitive' } },
          { marca_switch:   { contains: search, mode: 'insensitive' } },
          { localizacao:    { contains: search, mode: 'insensitive' } },
          { numero_patrimonio: { contains: search, mode: 'insensitive' } },
          { setor_rel: { nome: { contains: search, mode: 'insensitive' } } },
        ],
      })
    }

    if (setorId) AND.push({ setor_id: setorId })

    const where: any = AND.length > 0 ? { AND } : {}

    const [data, total] = await Promise.all([
      prisma.racks.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [safeSort]: dir },
        include: {
          setor_rel: { select: { id: true, nome: true } },
        },
      }),
      prisma.racks.count({ where }),
    ])

    const mapped = data.map((r: any) => ({
      ...r,
      setor_nome: r.setor_rel?.nome ?? r.localizacao ?? null,
      portas_livres: r.quantidade_portas != null && r.portas_em_uso != null
        ? Math.max(0, r.quantidade_portas - r.portas_em_uso)
        : null,
    }))

    return NextResponse.json({ data: mapped, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('[GET /api/racks]', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Erro interno', data: [], total: 0, page: 1, totalPages: 1 }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { usuario_id, usuario_nome } = await getAuditSession(request)
    const body = await request.json()

    // Nunca salvar portas_livres — é calculado
    const { portas_livres, ...data } = body

    const item = await prisma.racks.create({ data })

    await registrarAuditoria({
      tabela: 'racks',
      registro_id: item.id,
      acao: 'CREATE',
      descricao: `Rack "${item.nome_switch ?? item.id}" criado`,
      dados_novos: item as any,
      usuario_id,
      usuario_nome,
    })

    return NextResponse.json({
      ...item,
      portas_livres: item.quantidade_portas != null && item.portas_em_uso != null
        ? Math.max(0, item.quantidade_portas - item.portas_em_uso)
        : null,
    }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/racks]', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}