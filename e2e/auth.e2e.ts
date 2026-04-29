/**
 * Exemplo de Teste E2E com Playwright
 * Testa fluxos completos da aplicação no navegador
 */

import { test, expect } from '@playwright/test'

test.describe('Fluxo de Autenticação', () => {
  test('deve carregar a página de login', async ({ page }) => {
    await page.goto('/login')
    
    // Verifica se a página de login foi carregada
    await expect(page).toHaveTitle(/Acessar Sistema/i)
    
    // Verifica se os campos de entrada estão presentes
    await expect(page.getByLabel(/E-mail/i)).toBeVisible()
    await expect(page.getByLabel(/Senha/i)).toBeVisible()
  })

  test('deve exibir erro ao enviar credenciais inválidas', async ({ page }) => {
    await page.goto('/login')
    
    // Preenche os campos
    await page.getByLabel(/E-mail/i).fill('teste@example.com')
    await page.getByLabel(/Senha/i).fill('senhaincorreta')
    
    // Clica no botão de envio
    await page.getByRole('button', { name: /Entrar/i }).click()
    
    // Aguarda a mensagem de erro
    await expect(page.getByText(/E-mail ou senha incorretos/i)).toBeVisible()
  })

  test('deve redirecionar para dashboard após login bem-sucedido', async ({ page }) => {
    await page.goto('/login')
    
    // Preenche credenciais válidas (você deve ajustar para credenciais de teste reais)
    await page.getByLabel(/E-mail/i).fill('admin@pucminas.br')
    await page.getByLabel(/Senha/i).fill('senha123')
    
    // Clica no botão de envio
    await page.getByRole('button', { name: /entrar/i }).click()
    
    // Aguarda redirecionamento
    await page.waitForURL('/dashboard')
    await expect(page).toHaveURL(/\/dashboard/)
  })
})

test.describe('Navegação do Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada teste
    await page.goto('/login')
    await page.getByLabel(/E-mail/i).fill('admin@pucminas.br')
    await page.getByLabel(/Senha/i).fill('senha123')
    await page.getByRole('button', { name: /Entrar/i }).click()
    await page.waitForURL('/dashboard')
  })

  test('deve exibir menu lateral com opções', async ({ page }) => {
    await expect(page.getByRole('link', { name: /aparelhos/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /colaboradores/i })).toBeVisible()
  })

  test('deve navegar para página de aparelhos', async ({ page }) => {
    await page.getByRole('link', { name: /aparelhos/i }).click()
    await page.waitForURL('/aparelhos')
    await expect(page).toHaveURL(/\/aparelhos/)
  })
})
