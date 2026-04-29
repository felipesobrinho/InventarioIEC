# 🧪 Guia Completo de Testes - IEC Inventário

Este documento descreve como usar, implementar e manter os testes automatizados na aplicação IEC Inventário.

## 📋 Sumário

1. [Estrutura de Testes](#estrutura-de-testes)
2. [Jest - Testes Unitários](#jest---testes-unitários)
3. [React Testing Library - Testes de Componentes](#react-testing-library---testes-de-componentes)
4. [Playwright - Testes E2E](#playwright---testes-e2e)
5. [GitHub Actions - CI/CD](#github-actions---cicd)
6. [Fluxo de Branches](#fluxo-de-branches)
7. [Boas Práticas](#boas-práticas)
8. [Troubleshooting](#troubleshooting)

---

## 🗂️ Estrutura de Testes

```
projeto/
├── __tests__/                    # Testes unitários e de componentes
│   ├── components/              # Testes de componentes React
│   ├── hooks/                   # Testes de custom hooks
│   ├── utils/                   # Testes unitários de funções
│   └── __setup__/               # Setup compartilhado
├── e2e/                         # Testes end-to-end
├── jest.config.js               # Configuração do Jest
├── jest.setup.ts                # Setup do Jest (mocks globais)
├── playwright.config.ts         # Configuração do Playwright
└── .github/workflows/           # Workflows do GitHub Actions
    ├── test-dev.yml             # Testes para branch dev
    ├── test-prod.yml            # Testes para branch prod
    ├── test-main.yml            # Testes para branch main
    └── test-pr.yml              # Testes para PRs
```

---

## 🧪 Jest - Testes Unitários

### Instalação e Configuração ✓

Jest já está instalado e configurado. Arquivos de configuração:
- `jest.config.ts` - Configuração principal
- `jest.setup.ts` - Setup global (mocks, variáveis de ambiente)

### Executar Testes

```bash
# Executar todos os testes
npm test

# Modo watch (reexecuta ao salvar)
npm run test:watch

# Com cobertura de testes
npm run test:coverage

# Um arquivo específico
npm test -- formatters.test.ts

# Com padrão de nome
npm test -- --testNamePattern="deve formatar data"
```

### Exemplo de Teste Unitário

```typescript
// __tests__/utils/formatters.test.ts
import { describe, it, expect } from '@jest/globals'
import { validarEmail } from './formatters'

describe('validarEmail', () => {
  it('deve aceitar email válido', () => {
    expect(validarEmail('usuario@example.com')).toBe(true)
  })

  it('deve rejeitar email inválido', () => {
    expect(validarEmail('usuario@')).toBe(false)
  })
})
```

### Cobertura de Testes

A cobertura inclui:
- `app/` - Páginas e layouts
- `components/` - Componentes React
- `hooks/` - Custom hooks
- `lib/` - Funções utilitárias

Visualizar relatório:
```bash
npm run test:coverage
# Abrir coverage/lcov-report/index.html
```

---

## 🎨 React Testing Library - Testes de Componentes

### Filosofia

Testes devem simular como o usuário interage com a aplicação, não como o componente funciona internamente.

### Exemplo de Teste de Componente

```typescript
// __tests__/components/button.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ButtonExample } from '@/components/button'

describe('ButtonExample', () => {
  it('deve renderizar com label correto', () => {
    render(<ButtonExample label="Clique aqui" />)
    expect(screen.getByRole('button', { name: /Clique aqui/i })).toBeInTheDocument()
  })

  it('deve chamar onClick ao clicar', async () => {
    const handleClick = jest.fn()
    render(<ButtonExample label="Clique aqui" onClick={handleClick} />)
    
    const button = screen.getByRole('button', { name: /Clique aqui/i })
    await userEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('não deve ser clicável quando desabilitado', async () => {
    const handleClick = jest.fn()
    render(<ButtonExample label="Desabilitado" disabled onClick={handleClick} />)
    
    const button = screen.getByRole('button', { name: /Desabilitado/i })
    expect(button).toBeDisabled()
    
    await userEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })
})
```

### Queries Comuns

```typescript
// Por role (recomendado)
screen.getByRole('button', { name: /Enviar/i })
screen.getByRole('textbox', { name: /Email/i })

// Por label
screen.getByLabelText(/Senha/i)

// Por placeholder
screen.getByPlaceholderText(/Digite aqui/i)

// Por texto
screen.getByText(/Bem-vindo/i)

// Por testID (última opção)
screen.getByTestId('submit-button')
```

### Testando Componentes Cliente vs Servidor

```typescript
// Componentes cliente
'use client'

// Componentes servidor não precisam ser testados com RTL
// Teste a lógica de dados separadamente
```

---

## 🎭 Playwright - Testes E2E

### Instalação e Configuração ✓

Playwright está instalado. Configuração em `playwright.config.ts`.

### Executar Testes E2E

```bash
# Executar todos os testes E2E
npm run test:e2e

# Com UI interativa
npm run test:e2e:ui

# Debug modo
npm run test:e2e:debug

# Modo headed (vê o navegador)
npx playwright test --headed

# Navegador específico
npx playwright test --project chromium
npx playwright test --project firefox
npx playwright test --project webkit
```

### Exemplo de Teste E2E

```typescript
// e2e/auth.e2e.ts
import { test, expect } from '@playwright/test'

test('deve fazer login e navegar para dashboard', async ({ page }) => {
  // Navegação
  await page.goto('/login')
  
  // Verificações
  await expect(page).toHaveTitle(/Login/i)
  await expect(page.getByPlaceholder(/Email/i)).toBeVisible()
  
  // Interação
  await page.getByPlaceholder(/Email/i).fill('admin@test.com')
  await page.getByPlaceholder(/Senha/i).fill('senha123')
  await page.getByRole('button', { name: /Entrar/i }).click()
  
  // Verificação de resultado
  await page.waitForURL('/dashboard')
  await expect(page).toHaveURL(/\/dashboard/)
})
```

### Locators Importantes

```typescript
// Excelentes (recomendado)
page.getByRole('button', { name: /Submit/i })
page.getByPlaceholder(/search/i)
page.getByLabel(/Username/i)

// Bom
page.getByText(/Welcome/)
page.locator('data-testid=submit')

// Último recurso
page.locator('.sidebar >> button:has-text("Logout")')
```

### Reportes de Testes E2E

Os relatórios são gerados automaticamente em `playwright-report/`:

```bash
# Visualizar relatório
npx playwright show-report
```

---

## 🔄 GitHub Actions - CI/CD

### Configuração de Workflows ✓

Foram criados 4 workflows automáticos:

#### 1. **test-dev.yml** - Branch Dev

- ✅ Executa em: Push e PR para `dev`
- ✅ Testes: Unitários apenas
- ✅ Node versions: 18.x e 20.x (matrix)
- ✅ Relatório: Coverage para Codecov
- ✅ Comportamento: Informativo, não bloqueia

```bash
# Trigger
git push origin dev          # Executa workflow
gh pr create --base dev      # Executa em PR
```

#### 2. **test-prod.yml** - Branch Prod

- ✅ Executa em: Push e PR para `prod`
- ✅ Testes: Unitários + E2E + Lint + Build
- ✅ Node: 20.x
- ✅ Relatório: Coverage + Playwright
- ✅ Comentário automático em PR
- ✅ Comportamento: Informativo, não bloqueia

```bash
# Trigger
git push origin prod         # Executa workflow
gh pr create --base prod     # Executa em PR
```

#### 3. **test-main.yml** - Branch Main (BLOQUEANTE)

- ✅ Executa em: Push e PR para `main`
- ✅ Testes: Unitários + E2E + Lint + Build + Coverage Check
- ✅ Node: 20.x
- ✅ **Cobertura mínima**: 80%
- ✅ **Bloqueia merge** se falhar
- ✅ Notificação Slack (opcional)
- ✅ Relatório: 90 dias de retenção

```bash
# Trigger
git push origin main         # Bloqueia se falhar
gh pr create --base main     # Bloqueia se falhar
```

#### 4. **test-pr.yml** - Pull Requests

- ✅ Executa em: Abertura/sincronização de PR
- ✅ Testes: Unitários + Lint
- ✅ Comentário nos resultados
- ✅ Status check visual

---

## 🌳 Fluxo de Branches

```
main (produção)
    ↓ (validados + testes ✓)
prod (pré-produção)
    ↓ (validados + testes ✓)
dev (desenvolvimento)
    ↓ (testes ✓, pode ter falhas)
feature/xyz (features individuais)
```

### Workflow Recomendado

#### 1. Trabalhar em Feature

```bash
# Criar branch a partir de dev
git checkout dev
git pull origin dev
git checkout -b feature/adicionar-relatorios

# Fazer commits
git add .
git commit -m "feat: adicionar relatorios"

# Push
git push origin feature/adicionar-relatorios

# Criar PR para dev
gh pr create --base dev --title "Adicionar relatórios"
```

**Resultado**: ✅ Workflow `test-dev.yml` executa

#### 2. Validar em Dev

```bash
# Merge automático quando aprovado (dev é livre)
gh pr merge PR_NUMBER --merge

# Testes unitários passaram ✅
```

#### 3. Preparar para Prod

```bash
# Criar PR dev → prod
gh pr create --base prod

# Workflow test-prod.yml executa:
# - Testes unitários ✅
# - E2E ✅
# - Lint ✅
# - Build ✅
# - Relatórios automáticos ✅
```

**Resultado**: Se tudo passa, aprovação manual

#### 4. Validar em Prod

```bash
# Revisão manual
# Testes passaram: test-prod.yml ✅

# Merge para prod (requer aprovação)
gh pr merge PR_NUMBER --merge
```

#### 5. Deploy para Main

```bash
# Criar PR prod → main
gh pr create --base main

# Workflow test-main.yml executa:
# - Testes unitários com cobertura 80% ✅
# - Testes E2E ✅
# - Build ✅
# - Lint ✅
# - Se algum falha: ❌ BLOQUEIA MERGE
```

**Resultado**: Se tudo passa, merge automático ou manual

```bash
# Merge para main (requer que testes passem)
gh pr merge PR_NUMBER --merge
```

---

## ✅ Boas Práticas

### 1. Nomenclatura de Testes

```typescript
// ✅ BOM: Descreve o comportamento
it('deve enviar formulário com dados válidos', () => {})
it('deve exibir erro quando email está vazio', () => {})

// ❌ RUIM: Vago ou técnico
it('testa formulário', () => {})
it('submit test', () => {})
```

### 2. Estrutura AAA (Arrange, Act, Assert)

```typescript
// ✅ BOM
it('deve calcular total corretamente', () => {
  // Arrange
  const items = [10, 20, 30]
  
  // Act
  const total = calcularTotal(items)
  
  // Assert
  expect(total).toBe(60)
})

// ❌ RUIM (confuso)
it('teste', () => {
  expect(calcularTotal([10, 20, 30])).toBe(60)
})
```

### 3. Mock de Dependências Externas

```typescript
// Mock de chamadas API
jest.mock('@/lib/api', () => ({
  buscarDados: jest.fn().mockResolvedValue({ id: 1, nome: 'Teste' })
}))

// Mock de sessão
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { email: 'teste@test.com' } },
    status: 'authenticated'
  }))
}))
```

### 4. Testes de Integração vs Unitários

```typescript
// UNITÁRIO: Apenas a função
describe('validarEmail', () => {
  it('deve validar email', () => {
    expect(validarEmail('test@test.com')).toBe(true)
  })
})

// INTEGRAÇÃO: Com dependências
describe('FormularioCadastro', () => {
  it('deve enviar formulário com validação e API', async () => {
    // Setup
    // Interação
    // Verify API foi chamada
  })
})
```

### 5. Cobertura de Testes

```typescript
// Metas:
// - Unitários: 80%+
// - Componentes: 70%+
// - E2E: Fluxos críticos

// Não teste:
// - Bibliotecas externas (date-fns, zustand, etc)
// - Código gerado (prisma, next-auth)
// - Estilos CSS

// Teste:
// - Lógica customizada
// - Validações
// - Fluxos de usuário
```

### 6. Dados de Teste

```typescript
// ✅ BOM: Factory pattern
const usuarioFactory = (overrides = {}) => ({
  id: '1',
  email: 'teste@test.com',
  nome: 'Teste Usuario',
  ...overrides
})

// Uso
const usuario = usuarioFactory({ email: 'outro@test.com' })

// ❌ RUIM: Dados hardcoded duplicados
const user1 = { id: '1', email: 'teste1@test.com' }
const user2 = { id: '2', email: 'teste2@test.com' }
```

---

## 🐛 Troubleshooting

### Problema: "Cannot find module '@/*'"

**Solução**: Verificar `jest.config.ts` → `moduleNameMapper`

```typescript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
}
```

### Problema: "window.matchMedia is not a function"

**Solução**: Já está em `jest.setup.ts`, não precisa fazer nada

### Problema: Testes de componente com styled-components não funcionam

**Solução**: Adicione em `jest.setup.ts`:

```typescript
import 'jest-styled-components'
```

### Problema: "NEXTAUTH_SECRET is not set"

**Solução**: Variável de ambiente no `jest.setup.ts`:

```typescript
process.env.NEXTAUTH_SECRET = 'test-secret-key'
```

### Problema: Testes E2E timeout

**Solução**: Aumentar timeout em `playwright.config.ts`:

```typescript
timeout: 30 * 1000, // 30 segundos
navigationTimeout: 30 * 1000,
```

### Problema: GitHub Actions falha mas local passa

**Solução**: 
1. Verificar Node version (`actions/setup-node@v4`)
2. Rodar `npm ci` em vez de `npm install`
3. Verificar variáveis de ambiente

### Problema: Coverage não atualiza

**Solução**: 
```bash
rm -rf coverage
npm run test:coverage
```

---

## 📊 Monitoramento e Relatórios

### Coverage Reports

- Gerados automaticamente em cada workflow
- Enviados para Codecov
- Badge: [![codecov](https://codecov.io/gh/your-org/repo/branch/dev/graph/badge.svg)](https://codecov.io/gh/your-org/repo)

### Playwright Reports

- Disponível em: `test-results/`
- Visualizar: `npx playwright show-report`
- Armazenado no GitHub Actions por 30 dias

### Slack Notifications (Opcional)

Para habilitar notificações no Slack:

1. Criar webhook: https://api.slack.com/messaging/webhooks
2. Adicionar secret: `SLACK_WEBHOOK` no GitHub
3. Já está configurado em `test-main.yml`

---

## 🚀 Próximas Etapas

1. **Adicionar testes conforme desenvolve**
   - Todo novo componente deve ter testes
   - Todo novo hook deve ter testes
   - Toda lógica complexa deve ter testes

2. **Aumentar cobertura gradualmente**
   - Dev: 50% → 60%
   - Prod: 60% → 70%
   - Main: 80% (obrigatório)

3. **Integrar com seu CI/CD existente**
   - Discord/Slack notifications
   - Badge de status
   - Relatórios customizados

4. **Performance**
   - Paralelizar testes E2E
   - Cache de dependências
   - Otimizar builds

---

## 📚 Referências

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Última atualização**: 29 de abril de 2025
