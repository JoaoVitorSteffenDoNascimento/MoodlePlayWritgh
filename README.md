# MoodlePlayWritgh

Skill de Moodle e configurações do Playwright MCP para **Codex e Claude Code**. Nome de apresentação: **Moodle PlayWritgh**. Identificador do servidor: `moodle_playwright`.

O pacote permite navegar no Moodle, entrar com o próprio login, consultar cursos e prazos, baixar materiais, preencher formulários e enviar arquivos conforme o pedido do usuário. A skill é nova e genérica: não contém adaptações testadas para uma instituição específica.

## Perfil permissivo incluído

- Todas as ferramentas que o servidor expuser ficam previamente aprovadas no Codex; no Claude Code, uma regra autoriza todas as ferramentas desse servidor.
- Inclui cliques, formulários, uploads, downloads, diálogos, abas, capturas, JavaScript na página e execução de código no processo do Playwright.
- Habilita as capacidades adicionais `vision`, `pdf` e `devtools` da versão configurada.
- Habilita `--allow-unrestricted-file-access`: o MCP pode trabalhar com arquivos fora da pasta do projeto e URLs `file://`, dentro dos acessos do processo.
- Não define lista de restrição de domínios no MCP. As políticas de rede do ambiente continuam valendo.
- Abre uma janela de navegador para permitir login, MFA e acompanhamento. Pode ser usado sem janela acrescentando `--headless` aos argumentos, depois de configurar a autenticação necessária.

**Este é um perfil de alto acesso:** uma ação solicitada pode alterar ou excluir dados reais no Moodle, e a execução de código pode alcançar recursos do computador acessíveis ao processo do servidor. Instale somente se você deseja esse acesso. O pacote não remove restrições administrativas, regras gerenciadas ou permissões do sistema. Ele não habilita root, não desativa globalmente as proteções do Codex/Claude e não concede privilégios extras na instituição.

## Requisitos

- Codex ou Claude Code instalado e autenticado.
- Node.js compatível com `@playwright/mcp@0.0.82` (o pacote declara Node >= 18), com `npm` e `npx` no PATH. Prefira uma versão LTS ainda suportada.
- Google Chrome instalado no computador e uma sessão gráfica disponível. Linux sem interface gráfica precisa de adaptação para `--headless`; ambientes que bloqueiam a sandbox do Chrome podem exigir configuração própria.
- Acesso de rede para baixar o pacote npm e acessar seu Moodle.

A versão do MCP está fixada em `0.0.82`, a mesma encontrada na instalação de origem. Não é necessário copiar `node_modules`, Chromium ou os caminhos pessoais da instalação original. No Windows, se o cliente não localizar `npx`, use `npx.cmd` no campo `command`.

## Instalar no Codex

1. Baixe ou clone este repositório.
2. Copie a pasta `skills/moodle-playwright` para `~/.agents/skills/moodle-playwright` (no Windows, a pasta `.agents/skills` fica dentro da pasta do seu usuário).
3. Acrescente o conteúdo de [config/codex.toml](config/codex.toml) ao seu `~/.codex/config.toml`. Preserve as configurações existentes. Se já existir `mcp_servers.moodle_playwright`, concilie esse bloco para não duplicá-lo. Não mantenha overrides individuais mais restritivos se sua intenção for usar o perfil permissivo.
4. Reinicie o Codex. Execute `codex mcp list` para conferir o registro e peça ao agente para abrir seu Moodle.

`default_tools_approval_mode = "approve"` aplica aprovação prévia a todas as ferramentas desse servidor, salvo políticas superiores ou overrides. A skill pode ser invocada com `$moodle-playwright`.

## Instalar no Claude Code

1. Copie `skills/moodle-playwright` para `~/.claude/skills/moodle-playwright`.
2. Na pasta em que vai usar o Moodle, copie o conteúdo de [config/claude-mcp.json](config/claude-mcp.json) para `.mcp.json`. Se esse arquivo já existir, una o objeto `mcpServers` preservando os outros servidores.
3. Acrescente a regra `mcp__moodle_playwright__*` à lista `permissions.allow` de `~/.claude/settings.json`, como no exemplo [config/claude-settings.json](config/claude-settings.json). Preserve as outras configurações. Regras `deny` e `ask` existentes ou gerenciadas podem prevalecer.
4. Reinicie o Claude Code nessa pasta e aceite a confiança do projeto e a ativação do servidor, se solicitadas. Use `/mcp` para conferir a conexão e `/moodle-playwright` para chamar a skill.

A autorização abrange este MCP. Ela não libera automaticamente ferramentas de outros servidores, comandos do terminal ou todas as operações do Claude Code.

## Login e senha automática

Cada pessoa usa a própria conta. A primeira opção é pedir ao agente para abrir a URL do Moodle e fazer login na janela do navegador. O perfil do Playwright pode preservar a sessão; expiração de cookies, encerramento do perfil ou regras da instituição podem exigir novo login.

Se o titular fornecer as credenciais ou autorizar uma fonte local específica, o agente pode preenchê-las e enviar o formulário automaticamente. Uma integração com gerenciador de senhas precisa ser configurada separadamente. Este pacote não recupera senhas salvas no Chrome pessoal e não inclui credenciais de ninguém. MFA, CAPTCHA e consentimentos podem depender do titular.

Não compartilhe o perfil autenticado, cookies, tokens, senhas, `.env` ou dados acadêmicos pessoais junto com este repositório. O `.gitignore` ajuda a evitar inclusões acidentais, mas não examina o conteúdo dos arquivos.

## Exemplo de uso

> Use a skill moodle-playwright. Meu Moodle é https://moodle.minha-instituicao.example. Abra o site para eu entrar e depois liste as atividades com prazo nesta semana.

Depois do login, peça uma tarefa concreta, como baixar um material ou enviar um arquivo específico para uma atividade identificada. A autorização das ferramentas não é um pedido para executar ações extras por conta própria.

## Verificação e limites

Os exemplos TOML/JSON e o formato da skill foram validados localmente. As opções do servidor foram conferidas na ajuda do Playwright MCP `0.0.82`. A instalação em outros sistemas e o fluxo de login/entrega em um Moodle real ainda precisam ser testados por cada usuário. Diferentes versões, temas, SSO e permissões da conta mudam o comportamento.

## Fontes

- [Playwright MCP — Microsoft](https://github.com/microsoft/playwright-mcp)
- [Codex: configurar MCP](https://learn.chatgpt.com/docs/extend/mcp)
- [Codex: skills locais](https://learn.chatgpt.com/docs/build-skills)
- [Claude Code: MCP](https://code.claude.com/docs/en/mcp)
- [Claude Code: skills](https://code.claude.com/docs/en/skills)
- [Claude Code: permissões](https://code.claude.com/docs/en/permissions)
