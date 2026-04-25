import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registrarAuditoria, getAuditSession } from '@/lib/audit'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { maquina_id, colaborador_id, tipo_uso } = await request.json()
    if (!maquina_id || !colaborador_id) {
      return NextResponse.json({ error: 'maquina_id e colaborador_id são obrigatórios' }, { status: 400 })
    }

    const { usuario_id, usuario_nome } = await getAuditSession(request)

    const colaborador = await prisma.colaboradores.findUnique({
      where: { id: colaborador_id },
      select: { nome: true, setor: true },
    })

    await prisma.alocacoes_maquinas.updateMany({
      where: { maquina_id, ativo: true },
      data: { ativo: false, data_fim: new Date() },
    })

    const alocacao = await prisma.alocacoes_maquinas.create({
      data: {
        maquina_id,
        colaborador_id,
        tipo_uso: tipo_uso || null,
        data_inicio: new Date(),
        ativo: true,
      },
    })

    await registrarAuditoria({
      tabela: 'alocacoes_maquinas',
      registro_id: maquina_id,
      acao: 'ALOCAR',
      descricao: `Alocada para ${colaborador?.nome ?? colaborador_id}${colaborador?.setor ? ` (${colaborador.setor})` : ''}`,
      dados_novos: {
        alocacao_id: alocacao.id,
        colaborador_id,
        colaborador_nome: colaborador?.nome ?? null,
        colaborador_setor: colaborador?.setor ?? null,
        tipo_uso: tipo_uso || null,
      },
      usuario_id,
      usuario_nome,
    })

    return NextResponse.json(alocacao, { status: 201 })
  } catch (err) {
    console.error('[POST /api/alocacoes/maquinas]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}