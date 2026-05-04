import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria, getAuditSession } from '@/lib/audit'
import type { Prisma } from '@prisma/client'

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
    const status  = searchParams.get('status')   || ''
    const sort    = searchParams.get('sort')     || 'nome'
    const dir     = searchParams.get('dir') === 'desc' ? 'desc' : 'asc'

    const validSortFields: Record<string, boolean> = {
      nome: true, codigo: true, created_at: true,
    }
    const safeSort = validSortFields[sort] ? sort : 'nome'

    const AND: any[] = []

    if (search) {
      const codigo = parseInt(search, 10)
      AND.push({
        OR: [
          { nome: { contains: search, mode: 'insensitive' } },
          { setor_rel: { nome: { contains: search, mode: 'insensitive' } } },
          ...(!isNaN(codigo) ? [{ codigo }] : []),
        ],
      })
    }

    if (setorId)   AND.push({ setor_id: setorId })
    if (status)    AND.push({ status })

    const where: any = AND.length > 0 ? { AND } : {}
    const orderBy = { [safeSort]: dir }

    const [data, total] = await Promise.all([
      prisma.colaboradores.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          setor_rel: { select: { id: true, nome: true } },
        },
      }),
      prisma.colaboradores.count({ where }),
    ])

    const mapped = data.map((c: any) => ({
      ...c,
      setor_nome: c.setor_rel?.nome ?? c.setor ?? null,
    }))

    return NextResponse.json({ data: mapped, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('[GET /api/colaboradores]', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Erro interno', data: [], total: 0, page: 1, totalPages: 1 }, { status: 500 })
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
      dados_novos: item,
      usuario_id,
      usuario_nome,
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('[POST /api/colaboradores]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
