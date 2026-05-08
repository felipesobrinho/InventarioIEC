# 📝 Guia Prático de Testes - Exemplos para IEC Inventário

Exemplos práticos de como escrever testes para componentes e funcionalidades comuns na aplicação.

---

## 1. Testando Componentes de Formulário

### Exemplo: Input com Validação

```typescript
// __tests__/components/input-email.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

interface InputEmailProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
}

const InputEmail = ({ value, onChange, onBlur, error }: InputEmailProps) => (
  <div>
    <input
      type="email"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      aria-label="Email"
    />
    {error && <span role="alert">{error}</span>}
  </div>
)

describe('InputEmail', () => {
  it('deve aceitar entrada de texto', async () => {
    const handleChange = jest.fn()
    render(<InputEmail value="" onChange={handleChange} />)
    
    const input = screen.getByLabelText(/Email/i)
    await userEvent.type(input, 'usuario@test.com')
    
    expect(handleChange).toHaveBeenCalledWith('usuario@test.com')
  })

  it('deve exibir erro quando provided', () => {
    render(
      <InputEmail 
        value="" 
        onChange={jest.fn()} 
        error="Email inválido"
      />
    )
    
    expect(screen.getByText('Email inválido')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Email inválido')
  })

  it('deve chamar onBlur ao perder foco', async () => {
    const handleBlur = jest.fn()
    render(<InputEmail value="" onChange={jest.fn()} onBlur={handleBlur} />)
    
    const input = screen.getByLabelText(/Email/i)
    await userEvent.click(input)
    await userEvent.tab()
    
    expect(handleBlur).toHaveBeenCalled()
  })
})
```

---

## 2. Testando Modais

### Exemplo: Modal de Confirmação

```typescript
// __tests__/components/confirm-modal.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  if (!isOpen) return null
  
  return (
    <div role="dialog" aria-modal="true">
      <h2>{title}</h2>
      <p>{message}</p>
      <button onClick={onCancel}>{cancelText}</button>
      <button onClick={onConfirm}>{confirmText}</button>
    </div>
  )
}

describe('ConfirmModal', () => {
  it('não deve renderizar quando isOpen=false', () => {
    render(
      <ConfirmModal
        isOpen={false}
        title="Confirmar"
        message="Tem certeza?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('deve renderizar quando isOpen=true', () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="Deletar item?"
        message="Esta ação não pode ser desfeita"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Deletar item?')).toBeInTheDocument()
  })

  it('deve chamar onConfirm ao clicar em Confirmar', async () => {
    const handleConfirm = jest.fn()
    render(
      <ConfirmModal
        isOpen={true}
        title="Confirmar"
        message="Continuar?"
        onConfirm={handleConfirm}
        onCancel={jest.fn()}
      />
    )
    
    await userEvent.click(screen.getByRole('button', { name: /Confirmar/i }))
    expect(handleConfirm).toHaveBeenCalled()
  })

  it('deve chamar onCancel ao clicar em Cancelar', async () => {
    const handleCancel = jest.fn()
    render(
      <ConfirmModal
        isOpen={true}
        title="Confirmar"
        message="Continuar?"
        onConfirm={jest.fn()}
        onCancel={handleCancel}
      />
    )
    
    await userEvent.click(screen.getByRole('button', { name: /Cancelar/i }))
    expect(handleCancel).toHaveBeenCalled()
  })
})
```

---

## 3. Testando Custom Hooks

### Exemplo: Hook de Fetch de Dados

```typescript
// __tests__/hooks/use-fetch-data.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useFetchData } from '@/hooks/use-fetch-data'

// Mock da API
jest.mock('@/lib/api', () => ({
  fetchData: jest.fn(),
}))

import { fetchData } from '@/lib/api'

describe('useFetchData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve carregar dados com sucesso', async () => {
    const mockData = { id: 1, nome: 'Teste' }
    ;(fetchData as jest.Mock).mockResolvedValue(mockData)

    const { result } = renderHook(() => useFetchData('/api/dados'))

    // Inicialmente deve estar loading
    expect(result.current.loading).toBe(true)

    // Aguardar carregar
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Verificar dados
    expect(result.current.data).toEqual(mockData)
    expect(result.current.error).toBeNull()
  })

  it('deve tratar erro ao carregar', async () => {
    const mockError = new Error('Erro na requisição')
    ;(fetchData as jest.Mock).mockRejectedValue(mockError)

    const { result } = renderHook(() => useFetchData('/api/dados'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.data).toBeNull()
  })

  it('deve refetch dados quando chamado', async () => {
    const mockData = { id: 1 }
    ;(fetchData as jest.Mock).mockResolvedValue(mockData)

    const { result, rerender } = renderHook(() => useFetchData('/api/dados'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Chamar refetch
    result.current.refetch()

    // Verificar que foi chamado novamente
    expect(fetchData).toHaveBeenCalledTimes(2)
  })
})
```

---

## 4. Testando Tabelas de Dados

### Exemplo: Tabela com Sorting

```typescript
// __tests__/components/data-table.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

interface DataTableProps {
  data: any[]
  columns: { key: string; label: string }[]
  onSort?: (key: string) => void
}

const DataTable = ({ data, columns, onSort }: DataTableProps) => (
  <table>
    <thead>
      <tr>
        {columns.map((col) => (
          <th key={col.key} onClick={() => onSort?.(col.key)}>
            {col.label}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {data.map((row, idx) => (
        <tr key={idx}>
          {columns.map((col) => (
            <td key={col.key}>{row[col.key]}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
)

describe('DataTable', () => {
  it('deve renderizar dados corretamente', () => {
    const data = [
      { id: 1, nome: 'Aparelho 1' },
      { id: 2, nome: 'Aparelho 2' },
    ]
    const columns = [
      { key: 'id', label: 'ID' },
      { key: 'nome', label: 'Nome' },
    ]

    render(<DataTable data={data} columns={columns} />)

    expect(screen.getByText('Aparelho 1')).toBeInTheDocument()
    expect(screen.getByText('Aparelho 2')).toBeInTheDocument()
  })

  it('deve chamar onSort ao clicar no header', async () => {
    const handleSort = jest.fn()
    const data = [{ id: 1, nome: 'Teste' }]
    const columns = [{ key: 'id', label: 'ID' }]

    render(<DataTable data={data} columns={columns} onSort={handleSort} />)

    await userEvent.click(screen.getByText('ID'))

    expect(handleSort).toHaveBeenCalledWith('id')
  })
})
```

---

## 5. Testando Chamadas de API

### Exemplo: Teste de Integração com API

```typescript
// __tests__/api/aparelhos.test.ts
import { createAparelho, listarAparelhos } from '@/lib/api'

// Mock do fetch
global.fetch = jest.fn()

describe('API Aparelhos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve listar aparelhos', async () => {
    const mockData = [
      { id: 1, tipo: 'Monitor', status: 'ativo' },
      { id: 2, tipo: 'Teclado', status: 'inativo' },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    const dados = await listarAparelhos()

    expect(global.fetch).toHaveBeenCalledWith('/api/aparelhos', {
      method: 'GET',
    })
    expect(dados).toEqual(mockData)
  })

  it('deve criar novo aparelho', async () => {
    const novoAparelho = { tipo: 'Monitor', status: 'ativo' }
    const mockResponse = { id: 1, ...novoAparelho }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const resultado = await createAparelho(novoAparelho)

    expect(global.fetch).toHaveBeenCalledWith('/api/aparelhos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoAparelho),
    })
    expect(resultado).toEqual(mockResponse)
  })

  it('deve tratar erro da API', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    })

    await expect(listarAparelhos()).rejects.toThrow('HTTP Error: 500')
  })
})
```

---

## 6. Testando Autenticação

### Exemplo: Componente Protegido

```typescript
// __tests__/components/protected-page.test.tsx
import { render, screen } from '@testing-library/react'
import { useSession } from 'next-auth/react'

// Mock de next-auth
jest.mock('next-auth/react')

const ProtectedPage = () => {
  const { data: session, status } = useSession()

  if (status === 'loading') return <div>Carregando...</div>
  if (!session) return <div>Acesso negado</div>

  return <div>Bem-vindo, {session.user?.name}</div>
}

describe('ProtectedPage', () => {
  it('deve exibir mensagem de carregamento inicialmente', () => {
    ;(useSession as jest.Mock).mockReturnValueOnce({
      data: null,
      status: 'loading',
    })

    render(<ProtectedPage />)
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('deve bloquear acesso sem sessão', () => {
    ;(useSession as jest.Mock).mockReturnValueOnce({
      data: null,
      status: 'unauthenticated',
    })

    render(<ProtectedPage />)
    expect(screen.getByText('Acesso negado')).toBeInTheDocument()
  })

  it('deve renderizar conteúdo com sessão ativa', () => {
    ;(useSession as jest.Mock).mockReturnValueOnce({
      data: {
        user: { name: 'João Silva', email: 'joao@test.com' },
      },
      status: 'authenticated',
    })

    render(<ProtectedPage />)
    expect(screen.getByText(/Bem-vindo, João Silva/)).toBeInTheDocument()
  })
})
```

---

## 7. Testando Zustand Store

### Exemplo: State Management

```typescript
// __tests__/stores/aparelhos-store.test.ts
import { create } from 'zustand'

// Store exemplo
interface AparelhosStore {
  aparelhos: any[]
  loading: boolean
  adicionarAparelho: (aparelho: any) => void
  removerAparelho: (id: number) => void
  setLoading: (loading: boolean) => void
}

const useAparelhosStore = create<AparelhosStore>((set) => ({
  aparelhos: [],
  loading: false,
  adicionarAparelho: (aparelho) =>
    set((state) => ({
      aparelhos: [...state.aparelhos, aparelho],
    })),
  removerAparelho: (id) =>
    set((state) => ({
      aparelhos: state.aparelhos.filter((a) => a.id !== id),
    })),
  setLoading: (loading) => set({ loading }),
}))

describe('useAparelhosStore', () => {
  beforeEach(() => {
    useAparelhosStore.setState({ aparelhos: [], loading: false })
  })

  it('deve adicionar aparelho ao store', () => {
    const { getState } = useAparelhosStore

    getState().adicionarAparelho({ id: 1, tipo: 'Monitor' })

    expect(getState().aparelhos).toHaveLength(1)
    expect(getState().aparelhos[0].tipo).toBe('Monitor')
  })

  it('deve remover aparelho do store', () => {
    const { getState } = useAparelhosStore

    getState().adicionarAparelho({ id: 1, tipo: 'Monitor' })
    getState().adicionarAparelho({ id: 2, tipo: 'Teclado' })

    getState().removerAparelho(1)

    expect(getState().aparelhos).toHaveLength(1)
    expect(getState().aparelhos[0].id).toBe(2)
  })

  it('deve atualizar loading', () => {
    const { getState } = useAparelhosStore

    getState().setLoading(true)
    expect(getState().loading).toBe(true)

    getState().setLoading(false)
    expect(getState().loading).toBe(false)
  })
})
```

---

## 8. Testando Validações Zod

### Exemplo: Schema Validation

```typescript
// __tests__/utils/validators.test.ts
import { z } from 'zod'

// Schema exemplo
const CriarAparelhoSchema = z.object({
  tipo: z.string().min(3, 'Tipo deve ter pelo menos 3 caracteres'),
  status: z.enum(['ativo', 'inativo', 'em_manutencao']),
  responsavel: z.string().email('Email inválido'),
})

describe('CriarAparelhoSchema', () => {
  it('deve validar dados corretos', () => {
    const dados = {
      tipo: 'Monitor',
      status: 'ativo' as const,
      responsavel: 'usuario@test.com',
    }

    const resultado = CriarAparelhoSchema.safeParse(dados)

    expect(resultado.success).toBe(true)
    if (resultado.success) {
      expect(resultado.data.tipo).toBe('Monitor')
    }
  })

  it('deve rejeitar tipo muito curto', () => {
    const dados = {
      tipo: 'PC',
      status: 'ativo' as const,
      responsavel: 'usuario@test.com',
    }

    const resultado = CriarAparelhoSchema.safeParse(dados)

    expect(resultado.success).toBe(false)
    if (!resultado.success) {
      expect(resultado.error.issues[0].message).toContain('3 caracteres')
    }
  })

  it('deve rejeitar status inválido', () => {
    const dados = {
      tipo: 'Monitor',
      status: 'ativado',
      responsavel: 'usuario@test.com',
    }

    const resultado = CriarAparelhoSchema.safeParse(dados)

    expect(resultado.success).toBe(false)
  })

  it('deve rejeitar email inválido', () => {
    const dados = {
      tipo: 'Monitor',
      status: 'ativo' as const,
      responsavel: 'usuario-invalido',
    }

    const resultado = CriarAparelhoSchema.safeParse(dados)

    expect(resultado.success).toBe(false)
  })
})
```

---

## 9. Testando Utilitários de Data

### Exemplo: Formatadores de Data

```typescript
// __tests__/utils/date-utils.test.ts
import { formatarData, calcularDiasDesde, adicionarDias } from '@/lib/utils'

describe('Utilitários de Data', () => {
  describe('formatarData', () => {
    it('deve formatar data em pt-BR', () => {
      const data = new Date('2025-04-29T10:00:00Z')
      expect(formatarData(data)).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })

    it('deve aceitar string ISO', () => {
      expect(formatarData('2025-04-29')).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })
  })

  describe('calcularDiasDesde', () => {
    it('deve calcular dias corretamente', () => {
      const dataPassada = new Date('2025-04-20')
      const dataAgora = new Date('2025-04-29')

      const dias = calcularDiasDesde(dataPassada, dataAgora)
      expect(dias).toBe(9)
    })

    it('deve retornar 0 para mesma data', () => {
      const data = new Date('2025-04-29')
      expect(calcularDiasDesde(data, data)).toBe(0)
    })
  })

  describe('adicionarDias', () => {
    it('deve adicionar dias corretamente', () => {
      const data = new Date('2025-04-29')
      const novaData = adicionarDias(data, 5)

      expect(novaData.getDate()).toBe(4) // 29 + 5 = 4 (próximo mês)
      expect(novaData.getMonth()).toBe(4) // Maio
    })
  })
})
```

---

## 10. Test Utilities e Helpers

### Exemplo: Setup Customizado

```typescript
// __tests__/setup.ts
import { render, RenderOptions } from '@testing-library/react'
import React from 'react'

/**
 * Renderizador customizado com providers
 * Use quando componentes precisam de Context/Providers
 */
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</> // Adicione providers aqui
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

Usar em testes:
```typescript
// Importar do setup customizado
import { render, screen } from '__tests__/setup'

// Usar normalmente
render(<MeuComponente />)
```

---

## ✅ Checklist de Qualidade de Teste

- [ ] Nome descreve o comportamento (não técnico)
- [ ] Segue padrão AAA (Arrange, Act, Assert)
- [ ] Testa comportamento, não implementação
- [ ] Sem dependências externas hardcoded
- [ ] Isolado e independente
- [ ] Rápido (< 1s por teste)
- [ ] Determinístico (sempre mesmo resultado)
- [ ] Usa queries semânticas (getByRole, getByLabelText)
- [ ] Não testa bibliotecas externas
- [ ] Coverage adequada (80%+)

---

Próximo: Leia [TESTING.md](./TESTING.md) para referência completa

