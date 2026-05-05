import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria, getAuditSession, descricaoDiff } from '@/lib/audit'

export const runtime = 'nodejs'
type Props = { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const item = await prisma.notebooks.findUnique({
    where: { id },
    include: {
      alocacoes: {
        where: { ativo: true },
        include: { colaborador: { select: { nome: true, setor: true } } },
        orderBy: { data_inicio: 'asc' },
      },
      setor_rel: { select: { id: true, nome: true } },
    },
  })

  if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const result = {
    ...item,
    alocacoes_ativas: item.alocacoes.map((a: any) => ({
      id: a.id,
      colaborador: a.colaborador,
      motivo_alocacao: a.motivo_alocacao,
      tipo_posse: a.tipo_posse,
      data_inicio: a.data_inicio,
    })),
    alocacao_ativa: item.alocacoes[0]
      ? {
          colaborador: item.alocacoes[0].colaborador,
          motivo_alocacao: item.alocacoes[0].motivo_alocacao,
          tipo_posse: item.alocacoes[0].tipo_posse,
          data_inicio: item.alocacoes[0].data_inicio,
        }
      : null,
    alocacoes: undefined,
    setor_nome: item.setor_rel?.nome ?? item.setor ?? null,
  }

  return NextResponse.json(result)
}

export async function PUT(request: Request, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  
  if (!id) return NextResponse.json({ error: 'ID do notebook não fornecido' }, { status: 400 })
  
  const { usuario_id, usuario_nome } = await getAuditSession(request)
  const body = await request.json()
  const { alocacoes, alocacao_ativa, created_at, id: _id, ...rest } = body

  const anterior = await prisma.notebooks.findUnique({ where: { id } })
  if (!anterior) return NextResponse.json({ error: `Notebook não encontrado (ID: ${id})` }, { status: 404 })

  // Converter campos de data string para Date
  const data: any = { ...rest }
  if (data.emprestado_desde) {
    // "2026-04-30" → Date válido para o Prisma
    data.emprestado_desde = new Date(data.emprestado_desde + 'T00:00:00.000Z')
  } else if (data.emprestado_desde === '' || data.emprestado_desde === null) {
    data.emprestado_desde = null
  }

  // Validar colaborador se for atualizar empréstimo
  if (data.emprestado_colaborador_id) {
    const colaborador = await prisma.colaboradores.findUnique({
      where: { id: data.emprestado_colaborador_id },
    })
    if (!colaborador) {
      return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 })
    }
  }

  // Validar setor se for atualizar empréstimo
  if (data.emprestado_setor_id) {
    const setor = await prisma.setores.findUnique({
      where: { id: data.emprestado_setor_id },
    })
    if (!setor) {
      return NextResponse.json({ error: 'Setor não encontrado' }, { status: 404 })
    }
  }

  const item = await prisma.notebooks.update({ where: { id }, data })

  await registrarAuditoria({
    tabela: 'notebooks',
    registro_id: id,
    acao: 'UPDATE',
    descricao: descricaoDiff(anterior as any, data),
    dados_anteriores: anterior as any,
    dados_novos: data,
    usuario_id,
    usuario_nome,
  })

  return NextResponse.json(item)
}

export async function DELETE(request: Request, { params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  const { usuario_id, usuario_nome } = await getAuditSession(request)

  const anterior = await prisma.notebooks.findUnique({ where: { id } })
  await prisma.notebooks.delete({ where: { id } })

  await registrarAuditoria({
    tabela: 'notebooks',
    registro_id: id,
    acao: 'DELETE',
    descricao: `Notebook "${anterior?.modelo ?? id}" excluído`,
    dados_anteriores: anterior as any,
    usuario_id,
    usuario_nome,
  })

  return NextResponse.json({ ok: true })
}