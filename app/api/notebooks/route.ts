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
    const categoria = searchParams.get('categoria') || ''
    const fabricante = searchParams.get('fabricante') || ''

    const where: any = {}
    if (search) {
      where.OR = [
        { modelo: { contains: search, mode: 'insensitive' } },
        { numero_patrimonio: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (setor) where.setor = { contains: setor, mode: 'insensitive' }
    if (categoria) where.categoria = categoria
    if (fabricante) where.fabricante = { contains: fabricante, mode: 'insensitive' }

    const [data, total] = await Promise.all([
      prisma.notebooks.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { modelo: 'asc' },
        include: {
          alocacoes: {
            where: { ativo: true },
            take: 1,
            include: { colaborador: { select: { nome: true, setor: true } } },
          },
        },
      }),
      prisma.notebooks.count({ where }),
    ])

    const mapped = data.map((n: any) => ({
      ...n,
      alocacao_ativa: n.alocacoes[0]
        ? {
            colaborador: n.alocacoes[0].colaborador,
            motivo_alocacao: n.alocacoes[0].motivo_alocacao,
            tipo_posse: n.alocacoes[0].tipo_posse,
            data_inicio: n.alocacoes[0].data_inicio,
          }
        : null,
      alocacoes: undefined,
    }))

    return NextResponse.json({ data: mapped, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('[GET /api/notebooks]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { usuario_id, usuario_nome } = await getAuditSession(request)
    const body = await request.json()
    const item = await prisma.notebooks.create({ data: body })

    await registrarAuditoria({
      tabela: 'notebooks',
      registro_id: item.id,
      acao: 'CREATE',
      descricao: `Notebook "${item.modelo ?? item.numero_patrimonio ?? item.id}" criado`,
      dados_novos: item as any,
      usuario_id,
      usuario_nome,
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('[POST /api/notebooks]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}