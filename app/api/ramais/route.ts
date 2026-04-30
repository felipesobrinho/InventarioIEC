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
    const page            = Math.max(1, parseInt(searchParams.get('page')  || '1', 10))
    const limit           = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)))
    const search          = (searchParams.get('search') || '').trim().slice(0, 100) // Limit to 100 chars
    const disponibilidade = (searchParams.get('disponibilidade') || '').trim()
    const fila            = searchParams.get('fila') || ''
    const alocacao        = searchParams.get('alocacao') || ''
    const whatsapp        = searchParams.get('whatsapp') || ''
    const sort            = searchParams.get('sort') || 'numero_ramal'
    const dir             = searchParams.get('dir') === 'desc' ? 'desc' : 'asc'

    const validSortFields: Record<string, boolean> = {
      numero_ramal: true, nome_setor: true,
      prefixo_telefonico: true, disponibilidade: true, created_at: true,
    }
    const safeSort = validSortFields[sort] ? sort : 'numero_ramal'

    const AND: any[] = []

    if (search) {
      const searchConditions: any[] = [
        { nome_setor: { contains: search, mode: 'insensitive' } },
        { numero_ramal: { contains: search, mode: 'insensitive' } },
      ]
      
      searchConditions.push({
        alocacoes: {
          some: {
            ativo: true,
            colaborador: { nome: { contains: search, mode: 'insensitive' } } ,
          },
        },
      })
      
      AND.push({ OR: searchConditions })
    }

    if (disponibilidade) {
      AND.push({ disponibilidade: { contains: disponibilidade, mode: 'insensitive' } })
    }

    if (fila !== '') {
      AND.push({ fila: fila === 'true' })
    }

    // Filtro de alocação e whatsapp precisam de condições separadas em AND
    if (alocacao === 'alocado') {
      AND.push({ alocacoes: { some: { ativo: true, ramal_id: { not: null } } } })
    } else if (alocacao === 'livre') {
      AND.push({ alocacoes: { none: { ativo: true, ramal_id: { not: null } } } })
    }

    if (whatsapp === 'true') {
      AND.push({
        alocacoes: {
          some: { ativo: true, whatsapp: true, ramal_id: { not: null } },
        },
      })
    }

    const where: any = AND.length > 0 ? { AND } : {}

    const [data, total] = await Promise.all([
      prisma.ramais.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [safeSort]: dir },
        include: {
          alocacoes: {
            where: { ativo: true },
            include: { colaborador: { select: { nome: true, setor: true } } },
            orderBy: { data_inicio: 'asc' },
          },
        },
      }),
      prisma.ramais.count({ where }),
    ])

    // Buscar última edição do audit_log
    const ids = data.map((r: any) => r.id)
    const ultimasEdicoes = ids.length > 0
      ? await prisma.audit_log.findMany({
          where: { registro_id: { in: ids }, tabela: 'ramais', acao: 'UPDATE' },
          orderBy: { created_at: 'desc' },
          select: { registro_id: true, created_at: true },
        })
      : []

    const ultimaEdicaoMap: Record<string, string> = {}
    for (const log of ultimasEdicoes) {
      if (log.registro_id && !ultimaEdicaoMap[log.registro_id]) {
        ultimaEdicaoMap[log.registro_id] = log.created_at?.toISOString() ?? ''
      }
    }

    const mapped = data.map((r: any) => ({
      ...r,
      alocacoes_ativas: r.alocacoes.map((a: any) => ({
        id: a.id,
        colaborador: a.colaborador,
        tipo_base: a.tipo_base,
        whatsapp: a.whatsapp,
        canal_adicional: a.canal_adicional,
        data_inicio: a.data_inicio,
      })),
      alocacao_ativa: r.alocacoes[0]
        ? {
            colaborador: r.alocacoes[0].colaborador,
            tipo_base: r.alocacoes[0].tipo_base,
            whatsapp: r.alocacoes[0].whatsapp,
            data_inicio: r.alocacoes[0].data_inicio,
          }
        : null,
      ultima_revisao: ultimaEdicaoMap[r.id] ?? null,
      alocacoes: undefined,
    }))

    return NextResponse.json({ data: mapped, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('[GET /api/ramais] Error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Erro interno', data: [], total: 0, page: 1, totalPages: 1 }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { usuario_id, usuario_nome } = await getAuditSession(request)
    const body = await request.json()
    const item = await prisma.ramais.create({ data: body })

    await registrarAuditoria({
      tabela: 'ramais',
      registro_id: item.id,
      acao: 'CREATE',
      descricao: `Ramal "${item.numero_ramal ?? item.id}" criado`,
      dados_novos: item as any,
      usuario_id,
      usuario_nome,
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('[POST /api/ramais] Error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}