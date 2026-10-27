#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const BEGIN = '# BEGIN MoodlePlayWritgh managed configuration';
const END = '# END MoodlePlayWritgh managed configuration';
const ROOT = path.resolve(__dirname, '..');

function makeBlock(headless = false, windows = process.platform === 'win32') {
  const args = ['-y', '@playwright/mcp@0.0.82', '--browser', 'chrome', '--caps',
    'vision,pdf,devtools', '--allow-unrestricted-file-access', '--viewport-size',
    '1440x1000', '--timeout-action', '90000', '--timeout-navigation', '90000'];
  if (headless) args.push('--headless');
  // JSON string escaping is compatible with these TOML basic string values.
  return `${BEGIN}\n[mcp_servers.moodle_playwright]\n` +
    `command = ${JSON.stringify(windows ? 'npx.cmd' : 'npx')}\n` +
    `args = ${JSON.stringify(args)}\nstartup_timeout_sec = 120\n` +
    `tool_timeout_sec = 120\ndefault_tools_approval_mode = "approve"\n${END}\n`;
}

function mergeConfig(source, block) {
  const starts = source.split(BEGIN).length - 1;
  const ends = source.split(END).length - 1;
  if (starts !== ends || starts > 1) throw new Error('Bloco gerenciado incompleto ou duplicado. Nenhum arquivo alterado.');
  let remaining = source;
  let start = -1;
  let end = -1;
  if (starts) {
    start = source.indexOf(BEGIN);
    end = source.indexOf(END) + END.length;
    if (end < start) throw new Error('Marcadores fora de ordem. Nenhum arquivo alterado.');
    if (source[end] === '\r') end++;
    if (source[end] === '\n') end++;
    const managed = source.slice(start, end);
    const headers = managed.match(/^\s*\[/gm) || [];
    if (headers.length !== 1 || !managed.includes('[mcp_servers.moodle_playwright]')) {
      throw new Error('Bloco gerenciado foi modificado com outras tabelas. Revise-o manualmente antes de continuar.');
    }
    remaining = source.slice(0, start) + source.slice(end);
  }
  // Conservative conflict detection also catches quoted headers and inline tables.
  if (/moodle_playwright/.test(remaining)) {
    throw new Error('Já existe uma referência manual a moodle_playwright no config.toml. Faça backup e concilie esse servidor antes de rodar novamente; nada foi sobrescrito.');
  }
  if (starts) return source.slice(0, start) + block + source.slice(end);
  return source + (source.endsWith('\n') || !source ? '' : '\n') + '\n' + block;
}

function backup(target) {
  const destination = target + '.backup-' + Date.now() + '-' + Math.random().toString(16).slice(2, 8);
  fs.cpSync(target, destination, { recursive: true, errorOnExist: true, force: false });
  return destination;
}

function readObject(file) {
  if (!fs.existsSync(file)) return {};
  const value = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`JSON precisa ser um objeto: ${file}`);
  return value;
}

function addSkills(plan, home, client, root) {
  const destination = client === 'codex' ? path.join(home, '.agents', 'skills') : path.join(home, '.claude', 'skills');
  function visit(source, target) {
    for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      if (entry.isSymbolicLink()) throw new Error(`Link simbólico inesperado no pacote: ${entry.name}`);
      const from = path.join(source, entry.name), to = path.join(target, entry.name);
      if (entry.isDirectory()) visit(from, to);
      else if (entry.isFile()) plan.set(to, fs.readFileSync(from, 'utf8'));
    }
  }
  for (const name of ['moodle-playwright', 'netbeans-swing-ant']) {
    visit(path.join(root, 'skills', name), path.join(destination, name));
  }
}

function installClients({ home = os.homedir(), codexHome = process.env.CODEX_HOME || path.join(home, '.codex'),
  clients = ['codex'], headless = false, windows = process.platform === 'win32', root = ROOT } = {}) {
  const plan = new Map();
  const config = path.join(codexHome, 'config.toml');
  for (const client of clients) {
    if (client === 'codex') {
      const source = fs.existsSync(config) ? fs.readFileSync(config, 'utf8') : '';
      plan.set(config, mergeConfig(source, makeBlock(headless, windows)));
    } else if (client === 'claude') {
      if (process.env.CLAUDE_CONFIG_DIR) throw new Error('CLAUDE_CONFIG_DIR personalizado: use a instalação manual do Claude para não gravar no perfil errado.');
      const statePath = path.join(home, '.claude.json');
      const settingsPath = path.join(home, '.claude', 'settings.json');
      const receiptPath = path.join(home, '.claude', 'moodle-playwright-install.json');
      const state = readObject(statePath), settings = readObject(settingsPath), receipt = readObject(receiptPath);
      const server = JSON.parse(fs.readFileSync(path.join(root, 'config', 'claude-mcp.json'), 'utf8')).mcpServers.moodle_playwright;
      server.command = windows ? 'npx.cmd' : 'npx';
      if (headless) server.args.push('--headless');
      const object = (value, label) => {
        if (value !== undefined && (!value || typeof value !== 'object' || Array.isArray(value))) throw new Error(`Estrutura inválida: ${label}`);
        return value || {};
      };
      const servers = object(state.mcpServers, 'mcpServers');
      const equal = require('node:util').isDeepStrictEqual;
      if (servers.moodle_playwright && !equal(servers.moodle_playwright, server) && !equal(servers.moodle_playwright, receipt.server)) {
        throw new Error('Servidor manual moodle_playwright no Claude. Concilie-o com backup antes de instalar; nenhum arquivo foi alterado.');
      }
      state.mcpServers = { ...servers, moodle_playwright: server };
      const permissions = object(settings.permissions, 'permissions');
      const allow = permissions.allow === undefined ? [] : permissions.allow;
      if (!Array.isArray(allow) || allow.some(value => typeof value !== 'string')) throw new Error('permissions.allow precisa ser uma lista de textos.');
      settings.permissions = { ...permissions, allow: [...new Set([...allow, 'mcp__moodle_playwright__*'])] };
      const json = value => JSON.stringify(value, null, 2) + '\n';
      plan.set(statePath, json(state));
      plan.set(settingsPath, json(settings));
      plan.set(receiptPath, json({ server }));
    } else throw new Error(`Cliente desconhecido: ${client}`);
    addSkills(plan, home, client, root);
  }
  const changes = [];
  // All parsing and conflict checks finish before any backup or mutation.
  for (const [file, content] of plan) {
    if (fs.existsSync(file) && !fs.statSync(file).isFile()) throw new Error(`O destino não é um arquivo: ${file}`);
    const before = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (before !== content) changes.push({ file, content, before });
  }
  const backups = changes.filter(entry => entry.before !== null).map(entry => backup(entry.file));
  for (const entry of changes) {
    fs.mkdirSync(path.dirname(entry.file), { recursive: true });
    fs.writeFileSync(entry.file, entry.content, { mode: 0o600 });
  }
  return { config, skillTarget: path.join(home, '.agents', 'skills', 'moodle-playwright', 'SKILL.md'),
    backups, changed: changes.length > 0, files: [...plan.keys()], clients };
}

function install(options = {}) { return installClients({ ...options, clients: ['codex'] }); }

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('Uso: node scripts/install.cjs [--client codex|claude|both] [--headless]\nInstala as skills Moodle e NetBeans e o MCP permissivo. Cliente padrão: codex.');
    return;
  }
  let client = 'codex', headless = false;
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--headless') headless = true;
    else if (args[index] === '--client') client = args[++index];
    else throw new Error('Opção desconhecida. Use --help.');
  }
  if (!['codex', 'claude', 'both'].includes(client)) throw new Error('--client deve ser codex, claude ou both.');
  if (Number(process.versions.node.split('.')[0]) < 18) throw new Error('Requer Node.js >= 18. Instale uma versão LTS suportada.');
  const clients = client === 'both' ? ['codex', 'claude'] : [client];
  for (const command of ['npx', ...clients]) {
    const result = spawnSync(command, ['--version'], {
      shell: process.platform === 'win32', encoding: 'utf8', timeout: 15000
    });
    if (result.error || result.status !== 0) throw new Error(`${command} não está disponível no PATH. Instale-o e reabra o terminal.`);
  }
  const result = installClients({ clients, headless });
  console.log(result.changed ? `Moodle PlayWritgh instalado: ${clients.join(', ')}.` : 'Moodle PlayWritgh já está atualizado.');
  result.files.forEach(file => console.log(`Arquivo: ${file}`));
  result.backups.forEach(file => console.log(`Backup: ${file}`));
  console.log('Skills: moodle-playwright e netbeans-swing-ant (Java). Escrita simples é uma referência interna do Moodle.');
  console.log('Perfil permissivo: ferramentas do MCP aprovadas e acesso a arquivos fora do projeto; políticas existentes continuam valendo.');
  console.log('Chrome é necessário para o navegador. JDK, Ant e NetBeans são necessários conforme o exercício Java.');
  console.log('O MCP será baixado pelo npx na primeira conexão. Feche e abra os clientes após instalar.');
  if (clients.includes('codex')) console.log('Codex: codex mcp list e $moodle-playwright ou $netbeans-swing-ant.');
  if (clients.includes('claude')) console.log('Claude: /mcp e /moodle-playwright ou /netbeans-swing-ant.');
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(`Erro: ${error.message}`); process.exitCode = 1; }
}
module.exports = { makeBlock, mergeConfig, install, installClients };
