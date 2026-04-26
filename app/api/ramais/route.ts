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
    const disponibilidade = searchParams.get('disponibilidade') || ''
    const fila = searchParams.get('fila') || ''
    const sortBy = searchParams.get('sort') || 'created_at'
    const sortDir = searchParams.get('dir') === 'asc' ? 'asc' : ('desc' as const)
    const searchColab = searchParams.get('search_colab') || ''
    const alocacao = searchParams.get('alocacao') || ''

    const where: any = {}
    if (search) {
      where.OR = [
        { nome_host:    { contains: search, mode: 'insensitive' } },
        { identificador:{ contains: search, mode: 'insensitive' } },
        {
          alocacoes: {
            some: {
              ativo: true,
              colaborador: { nome: { contains: search, mode: 'insensitive' } },
            },
          },
        },
      ]
    }
    if (searchColab) {
      where.alocacoes = {
        some: {
          ativo: true,
          colaborador: {
            nome: { contains: searchColab, mode: 'insensitive' },
          },
        },
      }
    }
    if (alocacao === 'alocado') {
      where.alocacoes = { some: { ativo: true } }
    }
    if (alocacao === 'livre') {
      where.alocacoes = { none: { ativo: true } }
    }
    if (disponibilidade) where.disponibilidade = { contains: disponibilidade, mode: 'insensitive' }
    if (fila !== '') where.fila = fila === 'true'
    const validSort: Record<string, boolean> = {
      nome: true, created_at: true, codigo: true, setor: true,
    }
    const safeSort = validSort[sortBy] ? sortBy : 'nome'

    const [data, total] = await Promise.all([
      prisma.ramais.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { numero_ramal: 'asc' },
        include: {
          alocacoes: {
            where: { ativo: true },
            include: { colaborador: { select: { nome: true, setor: true } } },
            orderBy: { [safeSort]: sortDir }
          },
        },
      }),
      prisma.ramais.count({ where }),
    ])

    const mapped = data.map((m: any) => ({
      ...m,
      alocacoes_ativas: m.alocacoes.map((a: any) => ({
        id: a.id,
        colaborador: a.colaborador,
        tipo_uso: a.tipo_uso,
        data_inicio: a.data_inicio,
      })),
      alocacao_ativa: m.alocacoes[0]
        ? {
            colaborador: m.alocacoes[0].colaborador,
            tipo_uso: m.alocacoes[0].tipo_uso,
            data_inicio: m.alocacoes[0].data_inicio,
          }
        : null,
      alocacoes: undefined,
    }))

    return NextResponse.json({ data: mapped, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('[GET /api/ramais]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
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
    console.error('[POST /api/ramais]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}