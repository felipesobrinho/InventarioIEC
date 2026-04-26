import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

async function tryAudit(params: {
  tabela: string
  registro_id: string
  acao: string
  descricao: string
  dados_novos?: any
  usuario_id?: string | null
  usuario_nome?: string | null
}) {
  try {
    const { registrarAuditoria } = await import('@/lib/audit')
    await registrarAuditoria({ ...params, acao: params.acao as any })
  } catch (err) {
    console.error('[audit] falhou silenciosamente:', err)
  }
}

async function tryGetSession(request: Request) {
  try {
    const { getAuditSession } = await import('@/lib/audit')
    return await getAuditSession(request)
  } catch {
    return { usuario_id: null, usuario_nome: null }
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const setor = searchParams.get('setor') || ''
    const categoria = searchParams.get('categoria') || ''
    const fabricante = searchParams.get('fabricante') || ''
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
    if (setor) where.setor = { contains: setor, mode: 'insensitive' }
    if (categoria) where.categoria = categoria
    if (fabricante) where.fabricante = { contains: fabricante, mode: 'insensitive' }
    const validSort: Record<string, boolean> = {
      nome: true, created_at: true, codigo: true, setor: true,
    }
    const safeSort = validSort[sortBy] ? sortBy : 'nome'

    const [data, total] = await Promise.all([
      prisma.maquinas.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { nome_host: 'asc' },
        include: {
          alocacoes: {
            where: { ativo: true },
            include: { colaborador: { select: { nome: true, setor: true } } },
            orderBy: { [safeSort]: sortDir },
          },
        },
      }),
      prisma.maquinas.count({ where }),
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
    console.error('[GET /api/maquinas]', error)
    return NextResponse.json({ error: 'Erro interno', data: [], total: 0, page: 1, totalPages: 1 }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { usuario_id, usuario_nome } = await tryGetSession(request)
    const body = await request.json()
    const item = await prisma.maquinas.create({ data: body })

    await tryAudit({
      tabela: 'maquinas',
      registro_id: item.id,
      acao: 'CREATE',
      descricao: `Máquina "${item.nome_host ?? item.identificador ?? item.id}" criada`,
      dados_novos: item as any,
      usuario_id,
      usuario_nome,
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('[POST /api/maquinas]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}