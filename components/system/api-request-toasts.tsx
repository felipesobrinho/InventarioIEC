'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

const SLOW_REQUEST_MS = 700

function getRequestUrl(input: RequestInfo | URL) {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.toString()
  return input.url
}

function getRequestMethod(input: RequestInfo | URL, init?: RequestInit) {
  if (init?.method) return init.method.toUpperCase()
  if (typeof input !== 'string' && !(input instanceof URL)) return input.method.toUpperCase()
  return 'GET'
}

function isInternalApiRequest(input: RequestInfo | URL) {
  const url = getRequestUrl(input)

  if (url.startsWith('/api/')) return true

  if (typeof window === 'undefined') return false

  try {
    const parsed = new URL(url, window.location.origin)
    return parsed.origin === window.location.origin && parsed.pathname.startsWith('/api/')
  } catch {
    return false
  }
}

function getLoadingMessage(method: string) {
  switch (method) {
    case 'POST':
      return 'Salvando registro...'
    case 'PUT':
    case 'PATCH':
      return 'Atualizando registro...'
    case 'DELETE':
      return 'Removendo registro...'
    default:
      return 'Carregando dados...'
  }
}

async function getApiErrorMessage(response: Response) {
  const fallback = `A API retornou erro ${response.status}.`

  try {
    const json = await response.clone().json()
    if (typeof json?.error === 'string') return json.error
    if (typeof json?.message === 'string') return json.message
  } catch {
    return fallback
  }

  return fallback
}

export function ApiRequestToasts() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window)
    let pendingSlowReads = 0
    let sharedReadToastId: string | number | undefined

    window.fetch = async (input, init) => {
      if (!isInternalApiRequest(input)) {
        return originalFetch(input, init)
      }

      const method = getRequestMethod(input, init)
      const isRead = method === 'GET'
      let toastId: string | number | undefined
      let slowReadTracked = false

      const slowRequestTimer = window.setTimeout(() => {
        if (isRead) {
          slowReadTracked = true
          pendingSlowReads += 1

          if (!sharedReadToastId) {
            sharedReadToastId = toast(getLoadingMessage(method), { duration: Infinity })
          }
        } else {
          toastId = toast(getLoadingMessage(method), { duration: Infinity })
        }
      }, SLOW_REQUEST_MS)

      function clearLoadingToast() {
        window.clearTimeout(slowRequestTimer)

        if (slowReadTracked) {
          pendingSlowReads = Math.max(0, pendingSlowReads - 1)

          if (pendingSlowReads === 0 && sharedReadToastId) {
            toast.dismiss(sharedReadToastId)
            sharedReadToastId = undefined
          }

          return
        }

        if (toastId) toast.dismiss(toastId)
      }

      try {
        const response = await originalFetch(input, init)

        clearLoadingToast()

        if (!response.ok && isRead) {
          toast.error('Erro ao carregar dados.', {
            description: await getApiErrorMessage(response),
          })
        }

        return response
      } catch (error) {
        clearLoadingToast()

        if (isRead) {
          toast.error('Falha de conexão com a API.', {
            description: error instanceof Error ? error.message : 'Tente novamente em instantes.',
          })
        }

        throw error
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  return null
}
