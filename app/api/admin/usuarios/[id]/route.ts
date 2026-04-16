import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

type Props = { params: Promise<{ id: string }> }

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  if (!session) return false
  return (session.user as any).perfil === 'admin'
}

export async function PUT(request: NextRequest, { params }: Props) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  const { id } = await params
  const { nome, email, perfil, ativo, senha } = await request.json()
  const data: any = { nome, email, perfil, ativo }
  if (senha) data.senha_hash = await bcrypt.hash(senha, 10)
  const usuario = await prisma.usuarios.update({
    where: { id },
    data,
    select: { id: true, nome: true, email: true, perfil: true, ativo: true, created_at: true },
  })
  return NextResponse.json(usuario)
}

export async function DELETE(request: NextRequest, { params }: Props) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  const { id } = await params
  await prisma.usuarios.update({ where: { id }, data: { ativo: false } })
  return NextResponse.json({ ok: true })
}