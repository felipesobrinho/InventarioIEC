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
    const statusRaw = searchParams.get('status') || ''
    const chipRaw = searchParams.get('chip') || ''

    const where: any = {}
    if (search) where.modelo = { contains: search, mode: 'insensitive' }
    if (setor) where.setor = { contains: setor, mode: 'insensitive' }
    if (statusRaw !== '') where.status = statusRaw === 'true'
    if (chipRaw !== '') where.chip = chipRaw === 'true'

    const [data, total] = await Promise.all([
      prisma.aparelhos.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { modelo: 'asc' },
        include: {
          alocacoes: {
            where: { ativo: true },
            include: { colaborador: { select: { nome: true, setor: true } } },
            orderBy: { data_inicio: 'asc' }
          },
        },
      }),
      prisma.aparelhos.count({ where }),
    ])

    const mapped = data.map((m: any) => ({
      ...m,
      alocacoes_ativas: m.alocacoes.map((a: any) => ({
        id: a.id,
        colaborador: a.colaborador,
        tipo_uso: a.tipo_uso,
        data_inicio: a.data_inicio,
      })),
      // Manter alocacao_ativa como a primeira para retrocompatibilidade
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
    console.error('[GET /api/aparelhos]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { usuario_id, usuario_nome } = await getAuditSession(request)
    const body = await request.json()
    const item = await prisma.aparelhos.create({ data: body })

    await registrarAuditoria({
      tabela: 'aparelhos',
      registro_id: item.id,
      acao: 'CREATE',
      descricao: `Aparelho "${item.modelo ?? item.id}" criado`,
      dados_novos: item as any,
      usuario_id,
      usuario_nome,
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('[POST /api/aparelhos]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}