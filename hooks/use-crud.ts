import { useState } from 'react'
import { toast } from 'sonner'

export function useCrud(entity: string, onSuccess?: () => void) {
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function update(id: string, data: Record<string, any>) {
    setSaving(true)
    try {
      const res = await fetch(`/api/${entity}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      toast.success('Registro atualizado com sucesso!')
      onSuccess?.()
    } catch {
      toast.error('Erro ao atualizar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/${entity}/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Registro excluído com sucesso!')
      onSuccess?.()
    } catch {
      toast.error('Erro ao excluir. Tente novamente.')
    } finally {
      setDeleting(false)
    }
  }

  return { update, remove, saving, deleting }
}