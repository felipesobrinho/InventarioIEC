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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const setor = searchParams.get('setor') || ''
    const status = searchParams.get('status') || ''
    const sortBy = searchParams.get('sort') || 'created_at'
    const sortDir = searchParams.get('dir') === 'asc' ? 'asc' : ('desc' as const)
    const overview = searchParams.get('overview') === 'true'

    const where: Prisma.colaboradoresWhereInput = {}
    if (search) where.nome = { contains: search, mode: 'insensitive' }
    if (setor) where.setor = { contains: setor, mode: 'insensitive' }
    if (status === 'Ativo' || status === 'Inativo') where.status = status

    const validSort: Record<string, boolean> = {
      nome: true, created_at: true, codigo: true, setor: true,
    }
    const safeSort = validSort[sortBy] ? sortBy : 'nome'

    const totalPromise = prisma.colaboradores.count({ where })

    if (overview) {
      type ColaboradorOverview = Prisma.colaboradoresGetPayload<{
        include: {
          alocacoes_maquinas: { select: { id: true } }
          alocacoes_notebooks: { select: { id: true } }
          alocacoes_aparelhos: { select: { id: true } }
          alocacoes_ramais: { select: { id: true } }
        }
      }>

      const [data, total] = await Promise.all([
        prisma.colaboradores.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { [safeSort]: sortDir },
          include: {
            alocacoes_maquinas: { where: { ativo: true }, select: { id: true } },
            alocacoes_notebooks: { where: { ativo: true }, select: { id: true } },
            alocacoes_aparelhos: { where: { ativo: true }, select: { id: true } },
            alocacoes_ramais: { where: { ativo: true }, select: { id: true } },
          },
        }),
        totalPromise,
      ])

      const mapped = (data as ColaboradorOverview[]).map((colaborador) => ({
          ...colaborador,
          alocacoes_maquinas_ativas: colaborador.alocacoes_maquinas.length,
          alocacoes_notebooks_ativas: colaborador.alocacoes_notebooks.length,
          alocacoes_aparelhos_ativas: colaborador.alocacoes_aparelhos.length,
          alocacoes_ramais_ativas: colaborador.alocacoes_ramais.length,
          alocacoes_maquinas: undefined,
          alocacoes_notebooks: undefined,
          alocacoes_aparelhos: undefined,
          alocacoes_ramais: undefined,
        }))

      return NextResponse.json({ data: mapped, total, page, totalPages: Math.ceil(total / limit) })
    }

    const [data, total] = await Promise.all([
      prisma.colaboradores.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [safeSort]: sortDir },
      }),
      totalPromise,
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
