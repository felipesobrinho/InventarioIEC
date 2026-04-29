# 🔧 Configuração do GitHub para Testes

Este guia descreve como configurar seu repositório GitHub para garantir que os testes sejam executados automaticamente e que o fluxo de branches funcione corretamente.

## 1. Secrets e Variáveis de Ambiente

### Adicionar Secrets

Vá para: **Settings → Secrets and variables → Actions**

#### Secrets Obrigatórios

```
NEXTAUTH_SECRET
  Descrição: Chave secreta do NextAuth
  Valor: $(openssl rand -base64 32)
```

#### Secrets Opcionais

```
SLACK_WEBHOOK
  Descrição: URL do webhook do Slack para notificações
  Valor: https://hooks.slack.com/services/...
  Usar em: Notificações de teste na main
```

#### Variáveis (não-secretas)

```
CI=true
  Automático em workflows
```

---

## 2. Branch Protection Rules

### Proteger Branch Main

Vá para: **Settings → Branches → Add rule**

**Branch name pattern**: `main`

Configurações recomendadas:

- ✅ **Require a pull request before merging**
  - Require approvals: 1
  - Dismiss stale pull request approvals: ✓
  - Require review from code owners: ✓ (se usar CODEOWNERS)

- ✅ **Require status checks to pass before merging**
  - Require branches to be up to date before merging: ✓
  - Status checks that must pass:
    - `Validação Completa para Main` (test-main.yml)
    - `Lint` (se aplicável)

- ✅ **Require branches to be up to date before merging**
  - ✓ Garantir que branches estão sincronizados

- ✅ **Include administrators**
  - ✓ Aplicar regras também para admins

---

### Proteger Branch Prod

Vá para: **Settings → Branches → Add rule**

**Branch name pattern**: `prod`

Configurações recomendadas:

- ✅ **Require a pull request before merging**
  - Require approvals: 1

- ✅ **Require status checks to pass before merging**
  - Status checks que deve passar:
    - `Testes - Branch Prod` (test-prod.yml)

- ⚠️ **NÃO** bloqueia merge como main, apenas informa

---

### Branch Dev (Livre)

Sem restrições. Qualquer um pode fazer push e merge diretamente.

---

## 3. Code Owners (Opcional)

Crie arquivo: `.github/CODEOWNERS`

```
# Exemplo de CODEOWNERS

# Padrão: caminho  @usuario @equipe

# Testes
__tests__/                @seu-usuario
e2e/                      @seu-usuario
*.test.ts                 @seu-usuario
jest.config.ts            @seu-usuario

# Componentes
components/               @seu-usuario-ou-equipe

# API Routes
app/api/                  @seu-usuario-ou-equipe

# Todos os arquivos por padrão
*                         @seu-usuario
```

---

## 4. Configurar Workflow com Codecov

### Criar Conta no Codecov

1. Vá para https://codecov.io
2. Faça login com GitHub
3. Selecione seu repositório
4. Copie o token (opcional para repos públicos)

### Adicionar Badge

No `README.md`:

```markdown
[![codecov](https://codecov.io/gh/seu-org/seu-repo/branch/main/graph/badge.svg)](https://codecov.io/gh/seu-org/seu-repo)
```

### Verificar Upload

Nos logs do workflow, você verá:
```
✅ Coverage reports uploaded to Codecov
```

---

## 5. Configurar Workflow com Slack

### Criar Webhook do Slack

1. Vá para: https://api.slack.com/apps
2. Clique em **Create New App** → **From scratch**
3. Nome: `IEC Inventário`
4. Workspace: Selecione seu workspace

### Gerar Token

1. Na esquerda: **Incoming Webhooks**
2. Ativar: Toggle **Activate Incoming Webhooks**
3. Clique: **Add New Webhook to Workspace**
4. Selecione canal: `#testes` (ou criar novo)
5. Copie a URL: `https://hooks.slack.com/services/...`

### Adicionar Secret

No GitHub:
- **Settings → Secrets and variables → Actions**
- **New repository secret**
- Name: `SLACK_WEBHOOK`
- Value: Cole a URL

### Resultado

Quando testes falharem em main, você receberá:

```
❌ Testes falharam para main - Merge bloqueado
```

---

## 6. Status Checks Customizados

Suas workflows criam automaticamente status checks. Eles aparecem em:

1. **Pull Request**: Abaixo da descrição
2. **Branches**: Settings → Branches → Status checks
3. **Commits**: Ao lado do commit no histórico

---

## 7. Automação com GitHub Actions

### Auto-merge (Opcional)

Adicione ao seu workflow para merges automáticos:

```yaml
- name: Auto merge
  if: github.event_name == 'pull_request' && success()
  uses: pascalgn/automerge-action@v0.15.6
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    MERGE_METHOD: squash
    MERGE_COMMIT_MESSAGE: 'Merge #{pull_request.number}: {pull_request.title}'
    AUTOMERGE_LABEL: 'automerge'
```

### Dependabot (Opcional)

Para atualizações automáticas de dependências.

Crie: `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
      day: 'monday'
      time: '03:00'
    open-pull-requests-limit: 5
    reviewers:
      - seu-usuario
    labels:
      - dependencies
```

---

## 8. Verificação Local Antes de Push

Antes de fazer push, rode localmente:

```bash
# Testes unitários
npm test

# Se for para prod ou main
npm run test:e2e

# Lint
npm run lint

# Build
npm run build
```

---

## 9. Monitoramento de Workflows

### Verificar Status

No repositório: **Actions**

Status possíveis:
- 🟢 `completed` - Sucesso
- 🔴 `failed` - Falha
- 🟡 `in progress` - Rodando
- ⚪ `queued` - Aguardando

### Detalhes de Execução

Clique no workflow para ver:
- Logs de cada job
- Tempo de execução
- Artifacts gerados
- Errors/warnings

---

## 10. Troubleshooting

### Workflow não executa

1. Verificar branch: Está em `dev`, `prod` ou `main`?
2. Verificar arquivo YAML: Sintaxe correta?
3. Verificar permissões: Você tem acesso?

### Testes passam local mas falham em CI

1. Verificar Node version
2. Verificar variáveis de ambiente
3. Verificar permissões de arquivo
4. Rodar `npm ci` em vez de `npm install`

### Status check não aparece

1. Esperar o workflow completar (pode levar 1-2 min)
2. Fazer refresh na página (F5)
3. Verificar se o workflow YAML está correto

### Slack notification não vem

1. Verificar webhook URL no secret
2. Verificar se o canal existe
3. Verificar permissões do app no Slack
4. Rodar workflow manualmente para testar

---

## ✅ Checklist de Setup

- [ ] Secrets adicionados (NEXTAUTH_SECRET mínimo)
- [ ] Branch protection rules configuradas (main)
- [ ] Workflows criados em `.github/workflows/`
- [ ] Teste local: `npm test` funciona
- [ ] Teste E2E local: `npm run test:e2e` funciona
- [ ] Push para dev: workflow executa automaticamente
- [ ] PR para main: workflow bloqueia se testes falham

---

## 📞 Suporte

Dúvidas? Consulte:
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Codecov Setup](https://docs.codecov.io/docs)
- [Slack API](https://api.slack.com/docs)

