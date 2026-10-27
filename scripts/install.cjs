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

function install({ home = os.homedir(), codexHome = process.env.CODEX_HOME || path.join(home, '.codex'),
  headless = false, windows = process.platform === 'win32', root = ROOT } = {}) {
  const config = path.join(codexHome, 'config.toml');
  const source = fs.existsSync(config) ? fs.readFileSync(config, 'utf8') : '';
  const merged = mergeConfig(source, makeBlock(headless, windows));
  const skillSource = path.join(root, 'skills', 'moodle-playwright', 'SKILL.md');
  const skill = fs.readFileSync(skillSource, 'utf8');
  const skillTarget = path.join(home, '.agents', 'skills', 'moodle-playwright', 'SKILL.md');
  const oldSkill = fs.existsSync(skillTarget) ? fs.readFileSync(skillTarget, 'utf8') : null;
  const backups = [];
  // Finish preflight before writing either destination.
  for (const target of [config, skillTarget]) {
    if (fs.existsSync(target) && !fs.statSync(target).isFile()) throw new Error(`O destino não é um arquivo: ${target}`);
  }
  if (source !== merged && fs.existsSync(config)) backups.push(backup(config));
  if (oldSkill !== null && oldSkill !== skill) backups.push(backup(skillTarget));
  fs.mkdirSync(path.dirname(skillTarget), { recursive: true });
  fs.mkdirSync(codexHome, { recursive: true });
  if (source !== merged) fs.writeFileSync(config, merged, { mode: 0o600 });
  if (oldSkill !== skill) fs.writeFileSync(skillTarget, skill);
  return { config, skillTarget, backups, changed: source !== merged || oldSkill !== skill };
}

function main() {
  const options = process.argv.slice(2);
  if (options.includes('--help')) {
    console.log('Uso: node scripts/install.cjs [--headless]\nInstala a skill e o MCP permissivo no Codex do usuário atual.');
    return;
  }
  if (options.some(value => value !== '--headless')) throw new Error('Opção desconhecida. Use --help.');
  if (Number(process.versions.node.split('.')[0]) < 18) throw new Error('Requer Node.js >= 18. Instale uma versão LTS suportada.');
  for (const command of ['npx', 'codex']) {
    const result = spawnSync(command, ['--version'], {
      shell: process.platform === 'win32', encoding: 'utf8', timeout: 15000
    });
    if (result.error || result.status !== 0) throw new Error(`${command} não está disponível no PATH. Instale-o e reabra o terminal.`);
  }
  const result = install({ headless: options.includes('--headless') });
  console.log(result.changed ? 'Moodle PlayWritgh instalado no Codex.' : 'Moodle PlayWritgh já está atualizado.');
  console.log(`Configuração: ${result.config}\nSkill: ${result.skillTarget}`);
  result.backups.forEach(file => console.log(`Backup: ${file}`));
  console.log('Perfil permissivo: todas as ferramentas do MCP aprovadas e acesso a arquivos fora do projeto.');
  console.log('Requer Google Chrome instalado; o MCP será baixado pelo npx na primeira conexão.');
  console.log('Feche e abra o Codex. Confira com codex mcp list e invoque $moodle-playwright.');
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(`Erro: ${error.message}`); process.exitCode = 1; }
}
module.exports = { makeBlock, mergeConfig, install };
