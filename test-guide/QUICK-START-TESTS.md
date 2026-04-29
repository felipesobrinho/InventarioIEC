# 🚀 Quick Start - Testes

## Instalação ✓ Já Feita!

```bash
# Instalar dependências
npm install --save-dev jest @testing-library/react @testing-library/jest-dom playwright

# Scripts adicionados ao package.json
npm test                 # Rodar testes unitários
npm run test:watch      # Watch mode
npm run test:coverage   # Com cobertura
npm run test:e2e        # Testes Playwright
npm run test:e2e:ui     # Modo UI interativo
npm run test:all        # Tudo
```

---

## Estrutura de Pastas

```
projeto/
├── __tests__/           # Testes unitários
│   ├── utils/           # Testes de funções
│   ├── components/      # Testes de componentes
│   └── hooks/           # Testes de hooks
├── e2e/                 # Testes end-to-end
├── .github/workflows/   # CI/CD automatizado
└── jest.config.ts       # Configuração
```

---

## Criando Primeiro Teste

### 1. Teste Unitário

```bash
# Criar arquivo
mkdir -p __tests__/utils
cat > __tests__/utils/exemplo.test.ts << 'EOF'
describe('Função', () => {
  it('deve fazer algo', () => {
    expect(1 + 1).toBe(2)
  })
})
EOF

# Rodar
npm test -- exemplo.test.ts
```

### 2. Teste de Componente

```bash
# Criar arquivo
mkdir -p __tests__/components
cat > __tests__/components/botao.test.tsx << 'EOF'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('Botão', () => {
  it('deve clicar', async () => {
    const mock = jest.fn()
    render(<button onClick={mock}>Clique</button>)
    
    await userEvent.click(screen.getByText('Clique'))
    expect(mock).toHaveBeenCalled()
  })
})
EOF

# Rodar
npm test -- botao.test.tsx
```

### 3. Teste E2E

```bash
# Criar arquivo
cat > e2e/fluxo.e2e.ts << 'EOF'
import { test, expect } from '@playwright/test'

test('login flow', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[type="email"]', 'test@test.com')
  await page.click('button:has-text("Entrar")')
  await expect(page).toHaveURL('/dashboard')
})
EOF

# Rodar
npm run test:e2e -- fluxo.e2e.ts
```

---

## GitHub Actions Automático

Workflows já criados em `.github/workflows/`:

| Branch | Workflow | O que faz |
|--------|----------|----------|
| **dev** | test-dev.yml | ✅ Testes unitários |
| **prod** | test-prod.yml | ✅ Testes + E2E + Build |
| **main** | test-main.yml | 🔴 Bloqueia se falhar |

**Resultado**: Seu fluxo `dev → prod → main` agora tem testes automáticos!

---

## Commands Rápidos

```bash
# Desenvolvimento
npm test -- --watch                    # Watch mode

# Antes de commit
npm test && npm run lint               # Verificar tudo

# Antes de PR
npm test:coverage                      # Ver cobertura

# Antes de merge para main
npm run test:all                       # Testes + E2E

# Debug
npm test -- --verbose                  # Mais detalhes
npm test -- --testNamePattern="nome"   # Teste específico
npm run test:e2e:debug                # Debugar E2E
```

---

## Padrão: AAA (Arrange, Act, Assert)

```typescript
it('deve fazer algo', () => {
  // Arrange (Preparar)
  const entrada = { id: 1, nome: 'Teste' }
  
  // Act (Executar)
  const resultado = processar(entrada)
  
  // Assert (Verificar)
  expect(resultado).toBe(esperado)
})
```

---

## Queries: Ordem de Preferência

```typescript
// 1️⃣ Melhor - Semântica
screen.getByRole('button', { name: /Enviar/i })
screen.getByLabelText(/Email/i)
screen.getByPlaceholderText(/digite aqui/i)
screen.getByText(/Bem-vindo/i)

// 2️⃣ Bom
screen.getByTestId('submit-button')

// 3️⃣ Evitar
screen.getByClassName('btn-submit')
page.querySelector('.btn')
```

---

## Mocking Comum

```typescript
// Mock de função
const mockFunc = jest.fn()

// Mock de módulo
jest.mock('@/lib/api', () => ({
  fetch: jest.fn().mockResolvedValue({ ok: true })
}))

// Mock de hook
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { email: 'test@test.com' } }
  }))
}))
```

---

## Documentação Completa

- 📖 [TESTING.md](./TESTING.md) - Guia completo
- 📚 [TESTING-EXAMPLES.md](./TESTING-EXAMPLES.md) - Exemplos práticos
- ⚙️ [GITHUB-SETUP.md](./GITHUB-SETUP.md) - Configuração GitHub
- 🔗 [jest.config.ts](./jest.config.ts) - Config Jest
- 🎭 [playwright.config.ts](./playwright.config.ts) - Config Playwright

---

## Próximas Etapas

1. **Escrever testes para componentes principais**
   ```bash
   npm test -- --coverage    # Ver o que testar
   ```

2. **Adicionar ao seu workflow**
   ```bash
   git add __tests__/ e2e/
   git commit -m "test: adicionar testes"
   git push
   ```

3. **Monitorar no GitHub**
   - Abra uma PR → veja os workflows rodarem ✅
   - Merge para main → testes obrigatórios 🔴

---

## Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Cannot find module '@/*' | Verificar jest.config.ts |
| "window is not defined" | Configurado em jest.setup.ts ✓ |
| Teste testa implementação, não comportamento | Usar queries semânticas |
| Testes lentos | Usar jest.fn() para mocks |
| E2E não encontra elemento | Usar `page.waitFor()` |

---

**Começar agora**: Rode `npm test` e veja funcionando! 🎉

